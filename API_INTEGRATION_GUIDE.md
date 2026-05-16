# DentaLens X-ray API Integration Guide

This guide explains how the Thakaamed v2.3 X-ray API works and how it's integrated into DentaLens.

## API Flow

### 1. Upload X-ray (POST)

**Endpoint:** `https://aiv4.thakaamed.com/api/v2.3/[lang]/analyze/radiography/`

**Request:**
```python
POST https://aiv4.thakaamed.com/api/v2.3/en/analyze/radiography/

Data:
  - api_key: your_api_key
  - facility_code: your_facility_code

Files:
  - image: <binary image file>
```

**Response (202 Accepted):**
```json
{
  "status": true,
  "id": "9941c5cf-6e4f-4f02-9425-5b1e2aa6e0339da7a6c0-3032-4e76-a757-075701f23761",
  "results": "https://aiv4.thakaamed.com/api/v2.3/en/analyze/radiography/?id=9941c5cf-...",
  "message": "Analysis queued"
}
```

The `id` is the slug you'll use to retrieve results later.

### 2. Poll for Results (GET)

**Endpoint:** `https://aiv4.thakaamed.com/api/v2.3/[lang]/analyze/radiography/?id=[slug]`

**Request:**
```python
GET https://aiv4.thakaamed.com/api/v2.3/en/analyze/radiography/?id=9941c5cf-...

# Note: Only include `id` parameter. No facility_code or lang query params needed.
# Language is part of the URL path.
```

**Response (when is_done=false):**
```json
{
  "is_done": false,
  "id": "9941c5cf-...",
  "message": "Analysis in progress"
}
```

**Response (when is_done=true):**
```json
{
  "is_done": true,
  "id": "9941c5cf-...",
  "status": true,
  "error_status": false,
  "message": "Analysis completed",
  "response_time": 4.23,
  "draw_image": "https://aiv4.thakaamed.com/media/drawed_images/..._drawed.png",
  "original_image": "https://aiv4.thakaamed.com/media/uploaded_images/....jpg",
  "embeded_link": "https://aiv4.thakaamed.com/en/embeded_diagnosis/...",
  "embeded_report_link": "https://aiv4.thakaamed.com/en/embeded_report/...",
  "results": {
    "tooth_results": {
      "16": {
        "tooth": "16",
        "is_missing": false,
        "coordinates": { "xmin": 230, "ymin": 210, "xmax": 302, "ymax": 298, "proba": 94 },
        "illnesses": [
          { "name": "Interproximal caries", "probability": 88 },
          { "name": "Periapical risk", "probability": 42 }
        ]
      },
      "26": { ... },
      "36": { ... },
      "46": { ... }
    },
    "summary": {
      "teeth_detected": 32,
      "pathologies_detected": 12,
      "urgent_count": 3
    }
  }
}
```

## DentaLens Integration

### Backend Flow (`/backend/main.py`)

#### Step 1: Upload & Get Slug
```javascript
POST /xray-analyze
  - Frontend uploads image
  - Backend calls Thakaamed POST endpoint
  - Backend returns slug to frontend
```

**Backend Response:**
```json
{
  "slug": "9941c5cf-...",
  "id": "9941c5cf-...",
  "is_done": false,
  "image_width": 960,
  "image_height": 620
}
```

#### Step 2: Poll Results
```javascript
GET /xray-results/{slug}?lang=en
  - Frontend polls this endpoint repeatedly
  - Backend calls Thakaamed GET endpoint
  - When is_done=true, backend returns full analysis
```

**Backend Response (when ready):**
Returns the full Thakaamed response with `is_done: true` and all analysis data.

### Frontend Flow (`/frontend/src/pages/XrayResults.jsx`)

1. **Upload**: XrayFlow.jsx uploads to `http://localhost:8000/xray-analyze`
2. **Redirect**: XrayFlow.jsx navigates to XrayResults with slug
3. **Poll**: XrayResults.jsx polls `http://localhost:8000/xray-results/{slug}?lang=en` every 2 seconds
4. **Display**: When `is_done=true`, normalizeXrayResult() converts Thakaamed format to DentaLens format

> Note: When real Thakaamed credentials are configured, `/xray-results/{slug}` returns the actual API response. Placeholder data is only returned if the backend is missing `THAKAAMED_API_KEY` or `THAKAAMED_FACILITY_CODE`.

## Key Differences from Placeholder Mode

| Aspect | Placeholder | Real API |
|--------|------------|----------|
| Upload | Returns full analysis | Returns slug only |
| Results | Already in response | Must poll until `is_done=true` |
| Time | Instant | 4-30 seconds |
| Data Source | Hardcoded | Real Thakaamed analysis |
| Images | Placeholder URLs | Real annotated PNG + viewer link |

## Setup Instructions

### 1. Set Environment Variables

The backend reads credentials from the `.env` file at the repository root.

Open `/workspaces/DentaLens/.env` and set your real Thakaamed credentials:
```
THAKAAMED_API_KEY=your_real_api_key_here
THAKAAMED_FACILITY_CODE=your_real_facility_code_here
THAKAAMED_API_URL=https://aiv4.thakaamed.com/api/v2.3/en/analyze/radiography/
```

If `.env` does not exist, copy `.env.example` to `.env` and then replace the placeholder values.

### 2. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 3. Start Backend

The backend runs on port `8000`.

```bash
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 4. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

By default, Vite serves the frontend on port `5173` unless configured otherwise.

## Troubleshooting

### Error: "Analysis polling timed out"
- Thakaamed server is slow (can take 20-30s)
- Increase polling attempts in backend if needed

### Error: "API response did not include an analysis id"
- API credentials are invalid
- Check THAKAAMED_API_KEY and THAKAAMED_FACILITY_CODE

### Error: "Upload failed"
- Network issue or invalid image format
- Try PNG instead of JPEG
- Check image size (should be reasonable)

### Results show placeholder data
- Backend doesn't have real API credentials
- Check `.env` file is loaded
- Verify `THAKAAMED_API_KEY` and `THAKAAMED_FACILITY_CODE` are set
- Confirm the backend is running on port `8000`

## Language Support

Change language by modifying THAKAAMED_API_URL or passing `lang` parameter:

```
EN: https://aiv4.thakaamed.com/api/v2.3/en/analyze/radiography/
FR: https://aiv4.thakaamed.com/api/v2.3/fr/analyze/radiography/
AR: https://aiv4.thakaamed.com/api/v2.3/ar/analyze/radiography/
...
```

The frontend can request results in different languages without re-uploading the image:
```javascript
axios.get(`/xray-results/${slug}?lang=fr`)  // Get French labels
axios.get(`/xray-results/${slug}?lang=ar`)  // Get Arabic labels
```
