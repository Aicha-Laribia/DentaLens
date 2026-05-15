const COST_TABLE_MAD = {
  caries: ["Composite filling", 250, 700],
  cavity: ["Composite filling", 250, 700],
  decay: ["Composite filling", 250, 700],
  pulp: ["Root canal evaluation", 800, 2200],
  periapical: ["Diagnostic exam and vitality test", 150, 350],
  restoration: ["Restoration check or replacement", 150, 900],
}

function asArray(value) {
  if (Array.isArray(value)) return value
  if (value && typeof value === "object") return Object.values(value)
  return []
}

function clampProbability(value) {
  const number = Number(value || 0)
  if (number <= 1 && number > 0) return Math.round(number * 100)
  return Math.max(0, Math.min(100, Math.round(number)))
}

function treatmentFor(name = "") {
  const key = Object.keys(COST_TABLE_MAD).find(k => name.toLowerCase().includes(k))
  return COST_TABLE_MAD[key] || ["Dental consultation", 150, 350]
}

function buildProgression(tooth, illness) {
  const name = illness.name || "Dental finding"
  const probability = clampProbability(illness.probability)
  const lower = name.toLowerCase()

  if (lower.includes("pulp") || lower.includes("deep") || lower.includes("periapical")) {
    return {
      label: name,
      tooth,
      probability,
      untreated: [
        { time: "Now", desc: "The finding deserves clinical testing before symptoms escalate.", severity: 2 },
        { time: "Weeks-months", desc: "Pain with cold, heat, or biting can appear.", severity: 3 },
        { time: "Months-1 year", desc: "Infection can reach the root area and require endodontic care.", severity: 4 },
        { time: "Later", desc: "Abscess, swelling, or extraction risk can raise cost sharply.", severity: 5 },
      ],
      treated: "Prompt confirmation can keep care planned and conservative instead of urgent."
    }
  }

  return {
    label: name,
    tooth,
    probability,
    untreated: [
      { time: "Now", desc: "Early decay is often painless and easy to underestimate.", severity: 1 },
      { time: "6 months", desc: "The lesion can widen and cause sensitivity.", severity: 2 },
      { time: "1-2 years", desc: "Decay may reach the pulp and cause severe pain.", severity: 3 },
      { time: "2-3 years", desc: "Abscess or tooth loss becomes a realistic risk.", severity: 4 },
    ],
    treated: "Early treatment is usually quicker, cheaper, and preserves more tooth."
  }
}

function findingFromToothResult(tooth, result) {
  const illnesses = asArray(result.illnesses || result.pathologies || result.detections).map(ill => ({
    name: ill.name || ill.class_name || ill.label || "Detected finding",
    probability: clampProbability(ill.probability ?? ill.proba ?? ill.confidence ?? ill.confidence_pct),
  }))

  return {
    tooth: String(result.tooth || result.fdi || tooth),
    is_missing: Boolean(result.is_missing),
    illnesses,
    suspicious_lesion: Boolean(result.suspicious_lesion) || illnesses.some(ill => ill.probability >= 80),
    coordinates: result.coordinates || result.bbox || null,
    ai_second_opinion: result.ai_second_opinion || result.second_opinion || "",
  }
}

function buildCosts(findings) {
  const breakdown = []

  findings.forEach(finding => {
    finding.illnesses.forEach(illness => {
      if (illness.probability < 40) return
      const [treatment, min, max] = treatmentFor(illness.name)
      breakdown.push({
        tooth: finding.tooth,
        condition: illness.name,
        treatment,
        min,
        max,
      })
    })
  })

  return {
    breakdown,
    total_min: breakdown.reduce((sum, item) => sum + item.min, 0),
    total_max: breakdown.reduce((sum, item) => sum + item.max, 0),
    currency: "MAD",
    market: "Morocco 2026 placeholder estimates",
  }
}

export function normalizeXrayResult(raw, imageUrl) {
  if (!raw) return null

  const toothResults = raw.results?.tooth_results
  const findings = toothResults
    ? Object.entries(toothResults).map(([tooth, result]) => findingFromToothResult(tooth, result))
    : asArray(raw.findings).map(finding => findingFromToothResult(finding.tooth, finding))

  const normalizedFindings = findings.map(finding => ({
    ...finding,
    illnesses: asArray(finding.illnesses).map(ill => ({
      ...ill,
      probability: clampProbability(ill.probability),
    })),
  }))

  const costs = raw.costs?.breakdown?.length ? raw.costs : buildCosts(normalizedFindings)
  const progressions = raw.progressions?.length
    ? raw.progressions
    : normalizedFindings.flatMap(finding =>
        finding.illnesses
          .filter(illness => illness.probability >= 60)
          .map(illness => buildProgression(finding.tooth, illness))
      )

  const summary = raw.results?.summary || {
    teeth_detected: Math.max(32, normalizedFindings.length),
    pathologies_detected: normalizedFindings.reduce((sum, finding) => sum + finding.illnesses.length, 0),
    urgent_count: normalizedFindings.filter(finding => finding.illnesses.some(ill => ill.probability >= 75)).length,
  }

  return {
    ...raw,
    id: raw.id || raw.slug || "xray-placeholder",
    is_done: raw.is_done ?? true,
    message: raw.message || "Analysis ready.",
    displayImage: raw.draw_image || raw.original_image || imageUrl || null,
    original_image: raw.original_image || imageUrl || null,
    image_width: raw.image_width || 960,
    image_height: raw.image_height || 620,
    findings: normalizedFindings,
    costs,
    progressions,
    summary,
    has_suspicious: raw.has_suspicious || normalizedFindings.some(f => f.suspicious_lesion),
  }
}

export function severityForFinding(finding) {
  const max = Math.max(...(finding.illnesses?.map(ill => ill.probability) || [0]))
  if (max >= 75) return "urgent"
  if (max >= 40) return "monitor"
  return "clear"
}
