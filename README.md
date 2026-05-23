<div align="center">

# 🦷 DentaLens

### Smart Dental Care for Everyone

**From a selfie to a full AI-powered diagnosis — in seconds.**

[![Python](https://img.shields.io/badge/Python-3.10+-0F3460?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-0D9488?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-0F3460?style=flat-square&logo=react&logoColor=61DAFB)](https://react.dev)
[![YOLOv8](https://img.shields.io/badge/YOLOv8-mAP50%3A82.3%25-0D9488?style=flat-square)](https://ultralytics.com)
[![License](https://img.shields.io/badge/License-MIT-0F3460?style=flat-square)](LICENSE)

> ⚠️ **Demo prototype** — not a certified clinical tool. Always consult a qualified dentist.

---

*🏆 3rd Place — MedConnect Hackathon 2025*

</div>

---

## Overview

DentaLens is a dual-path AI dental triage and analysis platform built in 48 hours for the MedConnect Hackathon. It addresses a simple but critical gap: **most dental AI tools assume you already have an X-ray**. DentaLens starts before the clinic — with just a phone.

| Path | Input | Output |
|------|-------|--------|
| **Path 1 — Selfie Triage** | 4 guided mouth photos | Green / Yellow / Red urgency level + nearest imaging center |
| **Path 2 — X-Ray Analysis** | Dental radiograph (JPEG/PNG) | Full AI diagnosis + 3D model + costs + second opinion |

---

## Screenshots

### Landing Page
> Two-path entry — selfie triage or X-ray upload. Trilingual (EN / FR / AR) with automatic RTL support.

![Landing](docs/screenshots/landing.png)

---

### Path 2 — X-Ray Analysis + 3D Viewer

> ThakaaMed API annotated overlay (left) and interactive 3D tooth model colored by pathology category (right). 28 teeth annotated, drag to orbit, click to inspect.

![X-Ray + 3D](docs/screenshots/xray.jpeg)

---

### 3D Model — Pathology View

> Real Blender OBJ mesh (14,417 polygons). Each tooth vertex-labeled by FDI number. API findings painted as radial color spots: caries in dark brown, endo in red, restorations in bright white.

![3D Model](docs/screenshots/3d.png)

---

### VR View — Inside the Mouth

> WebXR-compatible immersive view. The patient walks inside their own mouth. Tooth labels float in 3D space with pathology severity (orange = endo, red = caries).

![VR View](docs/screenshots/vr_annot.png)

![VR View](docs/screenshots/vr_annotat.png)

---

## Architecture

```
dentalens/
├── frontend/                  # React + Vite + Tailwind
│   └── src/
│       ├── pages/             # Landing, PathChoice, XrayFlow, SelfieFlow, Results
│       ├── components/        # XrayViewer, ToothModel3D, NearbyMap, SmartQA, ChatBot
│       └── i18n.js            # EN / FR / AR translations
│
├── backend/                   # FastAPI
│   ├── main.py                # /analyze /selfie-triage /chat /nearby /yolo-analyze
│   ├── best.pt                # Trained YOLOv8n weights
│   └── static/model/          # Served 3D viewer HTML + data JSON
│
└── HackathonCOPY/
    ├── Teeth_LP_triangulated/ # Blender OBJ mesh + FDI labels + textures
    └── scripts/
        ├── build_annotated_dental_model.py   # Generates 3D viewer from API results
        ├── medconnect_web_app.py             # Flask server for 3D sessions
        └── templates/medconnect_viewer.html  # Three.js WebGL viewer
```

---

## AI Stack

### ThakaaMed API (X-Ray Path)
Production dental AI used by real clinics. Per analysis:
- **191 AI models** run on every panoramic radiograph
- Detects: caries, bone loss, implants, restorations, prostheses, periapical pathologies, calculus, sinuses, condyles
- Returns per-tooth FDI numbering, bounding boxes, polygonal coordinates, and confidence scores (0–100)
- Supports: panoramic, periapical, bitewing, lateral cephalometric

### YOLOv8n — Custom Trained (X-Ray Path)
Trained from scratch on a clinical dental benchmarking dataset:

| Metric | Score |
|--------|-------|
| mAP50 (overall) | **82.3%** |
| Decay (AP) | **91.6%** |
| Restoration (AP) | **73.0%** |
| Precision | 77.8% |
| Recall | 80.4% |

30 epochs · Tesla T4 GPU · 6.2 MB model · 2.2 ms inference

### Claude Vision (Selfie Triage Path)
Analyzes 4 guided mouth photos for:
- Gum health (color, recession, inflammation)
- Visible decay and tartar
- Oral lesion detection (leukoplakia, erythroplakia — oral cancer early warning)
- Returns: triage level, per-zone observations, and recommended action

---

## Features

**Path 1 — Selfie Triage**
- 4-step guided photo capture with instructions per zone
- AI clinical triage: 🟢 Green / 🟡 Yellow / 🔴 Red
- Oral cancer early-warning flag
- Nearest X-ray imaging centers via Google Places API
- Escalation path → Path 2 when X-ray is obtained


![Selfie](docs/screenshots/sef.jpeg)

**Path 2 — X-Ray Analysis**
- Zoomable annotated X-ray (pinch/scroll to inspect any region)
- Interactive 3D tooth model with per-pathology color coding
- VR mode (WebXR, one-flag enable)
- Progression timeline: untreated vs treated outcome per pathology
- Second opinion: compare AI findings against dentist's proposed plan
- Cost estimation in Moroccan Dirhams (MAD)
- Smart Q&A: rule-based, confidence-driven — zero API cost, zero hallucination risk
- Nearest dentists map via Google Places API

**General**
- Trilingual: English / French / Arabic (full RTL support)
- Demo mode: cached results, zero tokens consumed during development

---

## Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- Google Places API key
- ThakaaMed API key + facility code (hackathon or commercial)
- Anthropic API key (free tier sufficient for demo)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install fastapi uvicorn python-multipart requests anthropic python-dotenv ultralytics pillow aiofiles
```

Create `backend/.env`:
```env
THAKAAMED_API_KEY=your_key
THAKAAMED_FACILITY=your_facility
ANTHROPIC_API_KEY=your_key
GOOGLE_PLACES_API_KEY=your_key
```

```bash
uvicorn main:app --reload --port 8000
```

### 3D Viewer (Flask)

```bash
cd HackathonCOPY/HackathonCOPY
pip install flask python-dotenv requests
```

Create `.env` in that directory:
```env
THAKAA_API_KEY=your_key
THAKAA_FACILITY_CODE=your_facility
```

```bash
python scripts/medconnect_web_app.py
# Runs on http://127.0.0.1:5050
```

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:
```env
VITE_GOOGLE_MAPS_KEY=your_key
```

```bash
npm run dev
# Runs on http://localhost:5173
```

---

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/analyze` | ThakaaMed X-ray analysis + YOLO detection + cost estimation |
| `POST` | `/yolo-analyze` | YOLO-only inference on uploaded image |
| `POST` | `/selfie-triage` | Claude Vision triage on mouth photos |
| `POST` | `/second-opinion` | Compare dentist plan vs AI findings |
| `POST` | `/chat` | Contextual Q&A about analysis results |
| `GET`  | `/nearby` | Google Places: dentists or imaging centers near coordinates |

---

## 3D Model

The 3D dental mesh is a professional asset by [Simon Telezhkin](https://www.artstation.com/artwork/WW8xJ):
- 14,417 polygons · 7,217 vertices · 1 UDIM texture set (4K)
- Vertex-labeled per FDI tooth number via heuristic X-axis binning
- Pathologies painted as radial color spots with smooth cosine falloff
- Orbit, zoom, and click-to-inspect via Three.js WebGL viewer

---

## Roadmap

- [ ] Oral cancer fine-tuned classifier (TCIA + Kaggle lesion dataset)
- [ ] Darija voice assistant for rural accessibility
- [ ] Multi-scan longitudinal tracking with deterioration alerts
- [ ] Full VR activation for dental school training
- [ ] Offline mobile app via ONNX.js client-side inference
- [ ] ThakaaMed commercial licence + clinic integrations

---

## Team

**Team23 — MedConnect Hackathon 2025**

| | |
|---|---|
| **Alaa Belga** | Frontend · UI/UX · Pitch |
| **Aicha Laribia** | Backend · AI · 3D Integration |

---

## Disclaimer

DentaLens is a hackathon prototype. The AI models used here are diagnostic-aid tools. No output should be used directly on patients without validation by a qualified dentist. Do not upload real patient data without explicit consent.

---

<div align="center">

**🦷 DentaLens** · MedConnect Hackathon 2025 · 3rd Place 🏆

*Making dental care understandable and accessible for everyone.*

</div>