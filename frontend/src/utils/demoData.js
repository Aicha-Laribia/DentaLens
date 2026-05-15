export const DEMO_XRAY_RESULT = {
  id: "demo-placeholder-scan",
  slug: "demo",
  is_done: true,
  error_status: false,
  message: "Demo X-ray analysis completed locally. No external AI credits were used.",
  error_message: null,
  version: "dentallens-placeholder-2026.05",
  response_time: 0.2,
  draw_image: null,
  original_image: null,
  embeded_link: null,
  embeded_report_link: null,
  image_width: 960,
  image_height: 620,
  results: {
    summary: {
      teeth_detected: 32,
      pathologies_detected: 5,
      urgent_count: 3
    },
    tooth_results: {
      "16": {
        tooth: "16",
        is_missing: false,
        coordinates: { xmin: 230, ymin: 210, xmax: 302, ymax: 298, proba: 94 },
        illnesses: [
          { name: "Interproximal caries", probability: 88 },
          { name: "Periapical risk", probability: 42 }
        ],
        ai_second_opinion: "A filling is strongly supported. A root canal is not clearly supported unless symptoms or vitality testing confirm pulp involvement."
      },
      "26": {
        tooth: "26",
        is_missing: false,
        coordinates: { xmin: 618, ymin: 214, xmax: 695, ymax: 302, proba: 91 },
        illnesses: [{ name: "Deep caries close to pulp", probability: 76 }],
        ai_second_opinion: "Ask whether a pulp vitality test was done. If the tooth is vital, a conservative restoration may be considered before endodontic treatment."
      },
      "36": {
        tooth: "36",
        is_missing: false,
        coordinates: { xmin: 320, ymin: 375, xmax: 410, ymax: 472, proba: 90 },
        illnesses: [{ name: "Occlusal caries", probability: 84 }],
        ai_second_opinion: "A direct composite filling is consistent with the detected lesion. Treating early avoids a more expensive root canal later."
      },
      "46": {
        tooth: "46",
        is_missing: false,
        coordinates: { xmin: 524, ymin: 378, xmax: 612, ymax: 476, proba: 89 },
        illnesses: [
          { name: "Existing restoration", probability: 71 },
          { name: "Secondary caries risk", probability: 64 }
        ],
        ai_second_opinion: "Replacement of the restoration is reasonable if margins are open clinically. A crown should be justified by remaining tooth structure."
      }
    }
  },
  yolo_detections: [
    {
      class_id: 0,
      class_name: "Decay",
      confidence: 0.916,
      confidence_pct: 91.6,
      bbox: { x1: 320, y1: 180, x2: 410, y2: 260 }
    },
    {
      class_id: 1,
      class_name: "Restoration",
      confidence: 0.73,
      confidence_pct: 73.0,
      bbox: { x1: 500, y1: 200, x2: 580, y2: 275 }
    }
  ],
  findings: [
    {
      tooth: "16",
      is_missing: false,
      illnesses: [
        { name: "Interproximal caries", probability: 88 },
        { name: "Periapical risk", probability: 42 }
      ],
      suspicious_lesion: true,
      coordinates: { xmin: 230, ymin: 210, xmax: 302, ymax: 298, proba: 94 },
      ai_second_opinion: "A filling is strongly supported. A root canal is not clearly supported unless symptoms or vitality testing confirm pulp involvement."
    },
    {
      tooth: "26",
      is_missing: false,
      illnesses: [{ name: "Deep caries close to pulp", probability: 76 }],
      suspicious_lesion: true,
      coordinates: { xmin: 618, ymin: 214, xmax: 695, ymax: 302, proba: 91 },
      ai_second_opinion: "Ask whether a pulp vitality test was done. If the tooth is vital, a conservative restoration may be considered before endodontic treatment."
    },
    {
      tooth: "36",
      is_missing: false,
      illnesses: [{ name: "Occlusal caries", probability: 84 }],
      suspicious_lesion: true,
      coordinates: { xmin: 320, ymin: 375, xmax: 410, ymax: 472, proba: 90 },
      ai_second_opinion: "A direct composite filling is consistent with the detected lesion. Treating early avoids a more expensive root canal later."
    },
    {
      tooth: "46",
      is_missing: false,
      illnesses: [
        { name: "Existing restoration", probability: 71 },
        { name: "Secondary caries risk", probability: 64 }
      ],
      suspicious_lesion: false,
      coordinates: { xmin: 524, ymin: 378, xmax: 612, ymax: 476, proba: 89 },
      ai_second_opinion: "Replacement of the restoration is reasonable if margins are open clinically. A crown should be justified by remaining tooth structure."
    }
  ],
  costs: {
    breakdown: [
      { tooth: "16", condition: "Interproximal caries", treatment: "Composite filling", min: 250, max: 700 },
      { tooth: "16", condition: "Periapical risk", treatment: "Diagnostic exam and vitality test", min: 150, max: 350 },
      { tooth: "26", condition: "Deep caries close to pulp", treatment: "Deep filling or pulp cap", min: 500, max: 1200 },
      { tooth: "36", condition: "Occlusal caries", treatment: "Composite filling", min: 250, max: 650 },
      { tooth: "46", condition: "Existing restoration", treatment: "Clinical monitoring", min: 150, max: 300 },
      { tooth: "46", condition: "Secondary caries risk", treatment: "Restoration replacement", min: 400, max: 900 }
    ],
    total_min: 1700,
    total_max: 4100,
    currency: "MAD",
    market: "Morocco 2026 placeholder estimates"
  },
  progressions: [
    {
      label: "Interproximal caries",
      tooth: "16",
      probability: 88,
      untreated: [
        { time: "Now", desc: "Early enamel or dentin damage may be painless.", severity: 1 },
        { time: "6 months", desc: "The cavity can widen and start causing sensitivity.", severity: 2 },
        { time: "1-2 years", desc: "Decay may reach the pulp and cause severe pain.", severity: 3 },
        { time: "2-3 years", desc: "Abscess or tooth loss becomes a realistic risk.", severity: 4 }
      ],
      treated: "A filling now is usually quick, conservative, and much cheaper than emergency treatment."
    },
    {
      label: "Deep caries close to pulp",
      tooth: "26",
      probability: 76,
      untreated: [
        { time: "Now", desc: "The lesion is close enough to sensitive structures to deserve prompt clinical testing.", severity: 2 },
        { time: "Weeks-months", desc: "Inflammation may become painful, especially with cold, heat, or biting.", severity: 3 },
        { time: "Months-1 year", desc: "Infection can spread to the root area and require endodontic treatment.", severity: 4 },
        { time: "Later", desc: "Abscess, swelling, or extraction risk can raise the total cost sharply.", severity: 5 }
      ],
      treated: "Early diagnosis can keep treatment conservative. If the pulp is involved, a planned root canal is safer than waiting for an emergency."
    },
    {
      label: "Occlusal caries",
      tooth: "36",
      probability: 84,
      untreated: [
        { time: "Now", desc: "Early enamel or dentin damage may be painless.", severity: 1 },
        { time: "6 months", desc: "The cavity can widen and start causing sensitivity.", severity: 2 },
        { time: "1-2 years", desc: "Decay may reach the pulp and cause severe pain.", severity: 3 },
        { time: "2-3 years", desc: "Abscess or tooth loss becomes a realistic risk.", severity: 4 }
      ],
      treated: "A filling now is usually quick, conservative, and much cheaper than emergency treatment."
    }
  ],
  has_suspicious: true
}
