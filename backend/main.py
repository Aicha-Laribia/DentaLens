from fastapi import FastAPI, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image
import io
import time
import uuid
import os
from dotenv import load_dotenv

# Load environment variables from .env file
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
dotenv_path = os.path.join(project_root, '.env')
load_dotenv(dotenv_path)

try:
    from ultralytics import YOLO
except Exception:
    YOLO = None

app = FastAPI(title="DentaLens Local API")

# Configuration CORS pour autoriser ton frontend React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # À restreindre en production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Chargement optionnel du modèle YOLOv8. The X-ray track can run in a
# no-token placeholder mode, so the API should still boot without best.pt.
model = None
if YOLO is not None:
    try:
        print("Loading YOLO model...")
        model = YOLO("best.pt")
        print("Model loaded successfully!")
    except Exception as exc:
        print(f"YOLO model unavailable, placeholder mode enabled: {exc}")

# --- BASE DE CONNAISSANCES MÉDICALES (EXPERT SYSTEM) ---
MEDICAL_KB = {
    0: {  # Decay (Carie)
        "name": "Dental Caries (Decay)",
        "treatment": "Composite Restoration / Filling",
        "cost_min": 300,  # MAD
        "cost_max": 700,  # MAD
        "progression": {
            "label": "Cavity (Caries)",
            "untreated": [
                {"time": "Now", "desc": "Enamel decay. Often painless but structurally weakening.", "severity": 1},
                {"time": "6 months", "desc": "Reaches dentin. Sensitivity to hot/cold foods begins.", "severity": 2},
                {"time": "1-2 years", "desc": "Pulp infected (Pulpitis). Severe spontaneous pain.", "severity": 3},
                {"time": "2-3 years", "desc": "Abscess formation. Risk of tooth loss.", "severity": 4}
            ],
            "treated": "A simple composite filling (30-45 min) stops the decay and restores tooth integrity."
        }
    },
    1: {  # Restoration (Obturation/Couronne)
        "name": "Existing Restoration",
        "treatment": "Routine Monitoring",
        "cost_min": 0,    # Just a checkup
        "cost_max": 250,  # MAD (Standard consultation)
        "progression": {
            "label": "Existing Filling",
            "untreated": [
                {"time": "Now", "desc": "Restoration appears intact. Monitor for micro-leakage.", "severity": 1},
                {"time": "Annual", "desc": "Check margins during routine cleaning to prevent secondary decay.", "severity": 1}
            ],
            "treated": "Maintain good oral hygiene to maximize the lifespan of the restoration."
        }
    }
}

XRAY_PLACEHOLDER_TEETH = {
    "16": {
        "tooth": "16",
        "is_missing": False,
        "coordinates": {"xmin": 230, "ymin": 210, "xmax": 302, "ymax": 298, "proba": 94},
        "illnesses": [
            {"name": "Interproximal caries", "probability": 88},
            {"name": "Periapical risk", "probability": 42}
        ],
        "ai_second_opinion": "A filling is strongly supported. A root canal is not clearly supported unless symptoms or vitality testing confirm pulp involvement.",
    },
    "26": {
        "tooth": "26",
        "is_missing": False,
        "coordinates": {"xmin": 618, "ymin": 214, "xmax": 695, "ymax": 302, "proba": 91},
        "illnesses": [
            {"name": "Deep caries close to pulp", "probability": 76}
        ],
        "ai_second_opinion": "Ask whether a pulp vitality test was done. If the tooth is vital, a conservative restoration may be considered before endodontic treatment.",
    },
    "36": {
        "tooth": "36",
        "is_missing": False,
        "coordinates": {"xmin": 320, "ymin": 375, "xmax": 410, "ymax": 472, "proba": 90},
        "illnesses": [
            {"name": "Occlusal caries", "probability": 84}
        ],
        "ai_second_opinion": "A direct composite filling is consistent with the detected lesion. Treating early avoids a more expensive root canal later.",
    },
    "46": {
        "tooth": "46",
        "is_missing": False,
        "coordinates": {"xmin": 524, "ymin": 378, "xmax": 612, "ymax": 476, "proba": 89},
        "illnesses": [
            {"name": "Existing restoration", "probability": 71},
            {"name": "Secondary caries risk", "probability": 64}
        ],
        "ai_second_opinion": "Replacement of the restoration is reasonable if margins are open clinically. A crown should be justified by remaining tooth structure.",
    },
}

MOROCCO_2026_COSTS = {
    "Interproximal caries": ("Composite filling", 250, 700),
    "Deep caries close to pulp": ("Deep filling or pulp cap", 500, 1200),
    "Occlusal caries": ("Composite filling", 250, 650),
    "Existing restoration": ("Clinical monitoring", 150, 300),
    "Secondary caries risk": ("Restoration replacement", 400, 900),
    "Periapical risk": ("Diagnostic exam and vitality test", 150, 350),
}

def build_progression(tooth, illness, probability):
    lower = illness.lower()
    if "restoration" in lower:
        return {
            "label": illness,
            "tooth": tooth,
            "probability": probability,
            "untreated": [
                {"time": "Now", "desc": "Existing dental work should be checked for open margins or recurrent decay.", "severity": 1},
                {"time": "6-12 months", "desc": "If leakage is present, bacteria can expand underneath the filling.", "severity": 2},
                {"time": "1-2 years", "desc": "A larger replacement or crown may become necessary.", "severity": 3},
            ],
            "treated": "A clinical check and small repair, if needed, usually preserves more tooth structure and keeps cost controlled."
        }
    if "pulp" in lower or "deep" in lower or "periapical" in lower:
        return {
            "label": illness,
            "tooth": tooth,
            "probability": probability,
            "untreated": [
                {"time": "Now", "desc": "The lesion is close enough to sensitive structures to deserve prompt clinical testing.", "severity": 2},
                {"time": "Weeks-months", "desc": "Inflammation may become painful, especially with cold, heat, or biting.", "severity": 3},
                {"time": "Months-1 year", "desc": "Infection can spread to the root area and require endodontic treatment.", "severity": 4},
                {"time": "Later", "desc": "Abscess, swelling, or extraction risk can raise the total cost sharply.", "severity": 5},
            ],
            "treated": "Early diagnosis can keep treatment conservative. If the pulp is involved, a planned root canal is safer than waiting for an emergency."
        }
    return {
        "label": illness,
        "tooth": tooth,
        "probability": probability,
        "untreated": [
            {"time": "Now", "desc": "Early enamel or dentin damage may be painless.", "severity": 1},
            {"time": "6 months", "desc": "The cavity can widen and start causing sensitivity.", "severity": 2},
            {"time": "1-2 years", "desc": "Decay may reach the pulp and cause severe pain.", "severity": 3},
            {"time": "2-3 years", "desc": "Abscess or tooth loss becomes a realistic risk.", "severity": 4},
        ],
        "treated": "A filling now is usually quick, conservative, and much cheaper than emergency treatment."
    }

def build_placeholder_xray_response(image_url=None):
    findings = []
    progressions = []
    breakdown = []
    total_min = 0
    total_max = 0

    for tooth, record in XRAY_PLACEHOLDER_TEETH.items():
        finding = {
            "tooth": tooth,
            "is_missing": record["is_missing"],
            "coordinates": record["coordinates"],
            "illnesses": record["illnesses"],
            "suspicious_lesion": any(i["probability"] >= 80 for i in record["illnesses"]),
            "ai_second_opinion": record["ai_second_opinion"],
        }
        findings.append(finding)

        for illness in record["illnesses"]:
            treatment, min_cost, max_cost = MOROCCO_2026_COSTS.get(
                illness["name"],
                ("Dental consultation", 150, 350)
            )
            if min_cost > 0 or max_cost > 0:
                breakdown.append({
                    "tooth": tooth,
                    "condition": illness["name"],
                    "treatment": treatment,
                    "min": min_cost,
                    "max": max_cost,
                })
                total_min += min_cost
                total_max += max_cost
            if illness["probability"] >= 60:
                progressions.append(build_progression(tooth, illness["name"], illness["probability"]))

    return {
        "id": f"placeholder-{uuid.uuid4().hex[:8]}",
        "slug": "placeholder-xray",
        "is_done": True,
        "error_status": False,
        "message": "Placeholder analysis completed locally. No external AI credits were used.",
        "error_message": None,
        "version": "dentallens-placeholder-2026.05",
        "response_time": 0.2,
        "original_image": image_url or "https://via.placeholder.com/960x620?text=Original+X-ray",
        "draw_image": "https://via.placeholder.com/960x620?text=Annotated+X-ray+with+Overlays",
        "embeded_link": "https://example.com/embed-viewer?scan=placeholder",
        "embeded_report_link": "https://example.com/report.pdf",
        "image_width": 960,
        "image_height": 620,
        "results": {
            "tooth_results": XRAY_PLACEHOLDER_TEETH,
            "summary": {
                "teeth_detected": 32,
                "pathologies_detected": sum(len(t["illnesses"]) for t in XRAY_PLACEHOLDER_TEETH.values()),
                "urgent_count": sum(
                    1 for t in XRAY_PLACEHOLDER_TEETH.values()
                    if any(i["probability"] >= 75 for i in t["illnesses"])
                )
            }
        },
        "findings": findings,
        "costs": {
            "breakdown": breakdown,
            "total_min": total_min,
            "total_max": total_max,
            "currency": "MAD",
            "market": "Morocco 2026 placeholder estimates"
        },
        "progressions": progressions,
        "has_suspicious": any(f["suspicious_lesion"] for f in findings)
    }

def guess_tooth_location(x_center, img_width):
    """Logique simple pour deviner la zone dentaire selon les coordonnées"""
    if x_center < img_width * 0.33:
        return "Right Posterior"
    elif x_center > img_width * 0.66:
        return "Left Posterior"
    else:
        return "Anterior (Front)"

@app.post("/yolo-analyze")
async def analyze_yolo_scan(image: UploadFile = File(...)):
    # 1. Lecture de l'image
    contents = await image.read()
    img = Image.open(io.BytesIO(contents)).convert("RGB")
    img_width, img_height = img.size

    if model is None:
        return build_placeholder_xray_response()

    # 2. Inférence YOLO
    results = model.predict(img, conf=0.40)
    
    # 3. Préparation des structures de réponse
    yolo_detections = []
    findings = []
    breakdown = []
    progressions = []
    
    total_min_cost = 0
    total_max_cost = 0
    has_suspicious = False

    # 4. Traitement des résultats
    for idx, box in enumerate(results[0].boxes):
        class_id = int(box.cls[0])
        confidence = float(box.conf[0])
        coords = box.xyxy[0].tolist()
        
        # Coordonnées du centre pour deviner la zone
        x_center = (coords[0] + coords[2]) / 2
        location = guess_tooth_location(x_center, img_width)
        
        kb_info = MEDICAL_KB.get(class_id, MEDICAL_KB[0])
        class_name = kb_info["name"]
        
        if class_id == 0:  # Si c'est une carie
            has_suspicious = True

        # A. YOLO Detections (pour les Bounding Boxes du frontend)
        yolo_detections.append({
            "class_id": class_id,
            "class_name": class_name,
            "confidence": round(confidence, 3),
            "confidence_pct": round(confidence * 100, 1),
            "bbox": {
                "x1": round(coords[0]),
                "y1": round(coords[1]),
                "x2": round(coords[2]),
                "y2": round(coords[3])
            }
        })

        # B. Findings (Interprétation clinique)
        findings.append({
            "tooth": location,
            "is_missing": False,
            "illnesses": [{"name": class_name, "probability": round(confidence * 100)}],
            "suspicious_lesion": class_id == 0,
            "coordinates": {"xmin": round(coords[0]), "ymin": round(coords[1]), "xmax": round(coords[2]), "ymax": round(coords[3])}
        })

        # C. Costs (Estimation en MAD)
        breakdown.append({
            "tooth": location,
            "treatment": kb_info["treatment"],
            "min": kb_info["cost_min"],
            "max": kb_info["cost_max"]
        })
        total_min_cost += kb_info["cost_min"]
        total_max_cost += kb_info["cost_max"]

        # D. Progressions (Timeline)
        prog_data = kb_info["progression"].copy()
        prog_data["tooth"] = location
        prog_data["probability"] = round(confidence * 100)
        
        # On évite les doublons de progression si plusieurs caries sont trouvées
        if not any(p["label"] == prog_data["label"] for p in progressions):
            progressions.append(prog_data)

    # 5. Tri des détections par confiance
    yolo_detections.sort(key=lambda x: x["confidence"], reverse=True)

    # 6. Construction du JSON final (correspond exactement à DEMO_XRAY_RESULT)
    return {
        "slug": "yolo_analysis",
        "image_width": img_width,
        "image_height": img_height,
        "yolo_detections": yolo_detections,
        "findings": findings,
        "costs": {
            "breakdown": breakdown,
            "total_min": total_min_cost,
            "total_max": total_max_cost
        },
        "progressions": progressions,
        "has_suspicious": has_suspicious
    }

import os
# ... existing imports

THAKAAMED_API_URL = os.getenv("THAKAAMED_API_URL", "https://aiv4.thakaamed.com/api/v2.3/en/analyze/radiography/")
THAKAAMED_API_KEY = os.getenv("THAKAAMED_API_KEY")
THAKAAMED_FACILITY_CODE = os.getenv("THAKAAMED_FACILITY_CODE")

PLACEHOLDER_KEYS = {
    "your_api_key",
    "your_api_key_here",
    "your_facility_code",
    "your_facility_code_here",
}

def _real_api_enabled() -> bool:
    if not (THAKAAMED_API_KEY and THAKAAMED_FACILITY_CODE):
        return False

    key = THAKAAMED_API_KEY
    facility = THAKAAMED_FACILITY_CODE

    if key in PLACEHOLDER_KEYS or facility in PLACEHOLDER_KEYS:
        return False

    return True

def _poll_thakaamed_result(requests_module, slug: str, lang: str = "en", attempts: int = 20, interval: float = 3.0):
    """Poll Thakaamed API until analysis is done.
    
    The API endpoint changes language via the URL path, not query params.
    Example: https://aiv4.thakaamed.com/api/v2.3/en/analyze/radiography/?id=<slug>
    """
    # Reconstruct the endpoint with the correct language
    base_url = os.getenv("THAKAAMED_API_URL", "https://aiv4.thakaamed.com/api/v2.3/en/analyze/radiography/")
    
    # Replace language in URL if needed
    endpoint = base_url.replace("/en/", f"/{lang}/")
    
    for attempt in range(attempts):
        # Sleep before checking (except on first attempt)
        if attempt > 0:
            time.sleep(interval)
        
        try:
            # Only pass id parameter, no facility_code or lang on GET
            response = requests_module.get(endpoint, params={"id": slug}, timeout=30)
        except Exception as exc:
            print(f"Polling error on attempt {attempt + 1}: {exc}")
            continue
        
        if response.status_code != 200:
            print(f"Polling returned status {response.status_code}")
            continue
        
        try:
            data = response.json()
        except Exception as exc:
            print(f"Failed to parse JSON response: {exc}")
            continue
        
        # Check if analysis is done
        if data.get("is_done") is True:
            # Check for API errors
            if data.get("error_status") is True:
                error_msg = data.get('error_message') or data.get('message') or "Unknown API error"
                print(f"Thakaamed error: {error_msg}")
                return None
            return data
    
    print(f"Polling timed out after {attempts} attempts")
    return None

@app.post("/xray-analyze")
async def analyze_xray(image: UploadFile = File(...)):
    contents = await image.read()
    img_width = 960
    img_height = 620
    try:
        img = Image.open(io.BytesIO(contents)).convert("RGB")
        img_width, img_height = img.size
    except Exception:
        pass

    if _real_api_enabled():
        import requests
        file_content_type = image.content_type or 'application/octet-stream'
        files = {
            'image': ('xray', contents, file_content_type)
        }
        data = {
            'api_key': THAKAAMED_API_KEY,
            'facility_code': THAKAAMED_FACILITY_CODE,
        }
        response = requests.post(THAKAAMED_API_URL, data=data, files=files, timeout=60)
        if response.ok:
            payload = response.json()
            slug = payload.get('id') or payload.get('slug')
            if slug:
                return {
                    "slug": slug,
                    "id": payload.get('id'),
                    "results_url": payload.get('results'),
                    "message": payload.get('message', 'Analysis submitted'),
                    "is_done": payload.get('is_done', False),
                    "image_width": img_width,
                    "image_height": img_height
                }
            return JSONResponse(status_code=502, content={
                "error": "API response did not include an analysis id.",
                "payload": payload
            })

        return JSONResponse(status_code=502, content={
            "error": "Thakaamed upload failed.",
            "status_code": response.status_code,
            "text": response.text
        })

    response = build_placeholder_xray_response()
    response["image_width"] = img_width
    response["image_height"] = img_height
    return response

@app.get("/xray-results/{slug}")
async def get_xray_results(slug: str, lang: str = "en"):
    """Retrieve analysis results by slug. Polls Thakaamed if real API is enabled."""
    if _real_api_enabled():
        import requests
        result = _poll_thakaamed_result(requests, slug, lang=lang)
        if result is not None:
            # Return the full Thakaamed response
            return result
        # If polling failed or timed out
        return JSONResponse(status_code=504, content={
            "error": "Analysis polling timed out. Please try again.",
            "slug": slug,
            "is_done": False
        })
    
    # Fallback to placeholder
    return build_placeholder_xray_response()


@app.post("/second-opinion")
async def second_opinion(request: Request):
    payload = await request.json()
    findings = payload.get("findings", [])
    plan = payload.get("dentist_plan", "")
    issue_names = [
        f"Tooth {f.get('tooth')}: {ill.get('name')}"
        for f in findings
        for ill in f.get("illnesses", [])
        if ill.get("probability", 0) >= 50
    ]
    return {
        "summary": "Placeholder comparison only. It checks your dentist's plan against detected X-ray findings without spending AI tokens.",
        "supported": [item for item in issue_names if any(word in plan.lower() for word in item.lower().split())][:4],
        "unsupported": [] if plan.strip() else ["No dentist plan was provided to compare."],
        "missed": issue_names[:5],
        "questions": [
            "Which tooth number is each proposed treatment for?",
            "Can you show me where this appears on the X-ray?",
            "Is there a less invasive option if the pulp is still healthy?",
            "Can I have a written devis with Moroccan clinic prices before starting?"
        ],
    }

@app.post("/chat")
async def xray_chat(request: Request):
    payload = await request.json()
    message = payload.get("message", "").strip()
    findings = payload.get("findings", [])
    urgent = [
        f"tooth {f.get('tooth')}"
        for f in findings
        if any(i.get("probability", 0) >= 75 for i in f.get("illnesses", []))
    ]
    focus = ", ".join(urgent[:3]) if urgent else "the detected findings"
    return {
        "response": f"Placeholder answer: based on {focus}, bring the X-ray to a dentist for confirmation. Your question was: \"{message}\""
    }

@app.post("/selfie-triage")
async def real_selfie_triage(image: UploadFile = File(...)):
    # 1. On lit la vraie photo du patient
    contents = await image.read()
    img = Image.open(io.BytesIO(contents)).convert("RGB")
    img_width, img_height = img.size

    # 2. Ton modèle YOLO entre en action !
    results = model.predict(img, conf=0.40)
    
    findings = []
    yolo_detections = []
    total_detections = len(results[0].boxes)
    decay_count = 0
    restoration_count = 0
    avg_confidence = 0.0
    affected_areas = set()
    
    # 3. On extrait TES vraies coordonnées et probabilités
    for box in results[0].boxes:
        class_id = int(box.cls[0])
        confidence = float(box.conf[0])
        coords = box.xyxy[0].tolist()
        
        # Calculate bounding box area for severity assessment
        bbox_area = (coords[2] - coords[0]) * (coords[3] - coords[1])
        relative_size = bbox_area / (img_width * img_height)
        
        # Logique pour deviner la position (gauche/centre/droite) sur la photo
        x_center = (coords[0] + coords[2]) / 2
        if x_center < img_width * 0.33:
            tooth_location = "Right Side"
        elif x_center > img_width * 0.66:
            tooth_location = "Left Side"
        else:
            tooth_location = "Front Teeth"
        
        affected_areas.add(tooth_location)
        
        issue_name = "Visible Decay (Carie)" if class_id == 0 else "Existing Restoration"
        
        if class_id == 0:
            decay_count += 1
        else:
            restoration_count += 1
            
        avg_confidence += confidence
        
        # Determine severity based on confidence and size
        if confidence > 0.8 and relative_size > 0.05:
            severity = "High"
            risk_level = "Urgent"
        elif confidence > 0.6 or relative_size > 0.03:
            severity = "Medium" 
            risk_level = "Monitor"
        else:
            severity = "Low"
            risk_level = "Routine"
        
        findings.append({
            "tooth": tooth_location,
            "issue": issue_name,
            "probability": round(confidence * 100),
            "is_decay": class_id == 0,
            "severity": severity,
            "risk_level": risk_level,
            "bbox_size": round(relative_size * 100, 2)  # percentage of image
        })

        yolo_detections.append({
            "class_name": issue_name,
            "confidence_pct": round(confidence * 100, 1),
            "bbox": {
                "x1": round(coords[0]),
                "y1": round(coords[1]),
                "x2": round(coords[2]),
                "y2": round(coords[3])
            }
        })
    
    # Calculate summary statistics
    if total_detections > 0:
        avg_confidence = avg_confidence / total_detections
    else:
        avg_confidence = 0.0
    
    # Overall assessment
    if decay_count > 2 or (decay_count > 0 and any(f["severity"] == "High" for f in findings)):
        overall_assessment = "Concerning"
        overall_score = 3  # 1-5 scale, 5 being worst
        recommendation = "Schedule dental appointment within 1-2 weeks"
    elif decay_count > 0:
        overall_assessment = "Needs Attention"
        overall_score = 2
        recommendation = "Monitor and consult dentist if symptoms develop"
    elif restoration_count > 0:
        overall_assessment = "Stable"
        overall_score = 1
        recommendation = "Continue regular check-ups every 6 months"
    else:
        overall_assessment = "Excellent"
        overall_score = 0
        recommendation = "Maintain current oral hygiene routine"

    # On renvoie les vraies données au Frontend
    return {
        "image_width": img_width,
        "image_height": img_height,
        "findings": findings,
        "yolo_detections": yolo_detections,
        "summary": {
            "total_detections": total_detections,
            "decay_count": decay_count,
            "restoration_count": restoration_count,
            "affected_areas_count": len(affected_areas),
            "average_confidence": round(avg_confidence * 100, 1),
            "overall_assessment": overall_assessment,
            "overall_score": overall_score,
            "recommendation": recommendation
        }
    }
    
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
