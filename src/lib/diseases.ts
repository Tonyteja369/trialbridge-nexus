/**
 * Disease areas used across the public site.
 * Nothing here is a clinical claim: conditions and variables describe what a
 * research workflow would look at, not findings produced by ClinQSphereX.
 */

export type Disease = {
  slug: string;
  name: string;
  short: string;
  /** Query sent to the public ClinicalTrials.gov registry. */
  condition: string;
  focus: string;
  overview: string;
  conditions: string[];
  /** Research variables a screening workflow could use, if present in the dataset. */
  variables: string[];
  /** Illustrative structured criteria (synthetic demonstration only). */
  criteria: { label: string; expected: string }[];
  complexity: string;
  dataStatus: "Synthetic research data" | "Synthetic research data (limited)";
};

export const diseases: Disease[] = [
  {
    slug: "heart-cardiovascular",
    name: "Heart & Cardiovascular",
    short: "Heart",
    condition: "heart failure",
    focus: "Recruitment for heart failure, coronary and rhythm studies",
    overview:
      "Cardiovascular studies usually combine routine measurements — blood pressure, heart rate, ejection fraction, laboratory values — with medication and event history. That makes eligibility highly structured, and a good demonstration of how protocol text becomes checkable criteria.",
    conditions: [
      "Coronary artery disease",
      "Heart failure",
      "Atrial fibrillation",
      "Hypertension",
      "Cardiomyopathy",
    ],
    variables: [
      "Age",
      "Systolic / diastolic blood pressure",
      "Heart rate",
      "BMI",
      "Ejection fraction (where recorded)",
      "Relevant laboratory values",
      "Cardiovascular history",
      "Medication history",
    ],
    criteria: [
      { label: "Age", expected: "18–85 years" },
      { label: "Documented heart failure diagnosis", expected: "Present" },
      { label: "Ejection fraction", expected: "≤ 40%" },
      { label: "Systolic blood pressure", expected: "≥ 90 mmHg" },
      { label: "Recent acute coronary event", expected: "Absent in last 90 days" },
    ],
    complexity: "Structured measurements make criteria checkable, but records are often incomplete.",
    dataStatus: "Synthetic research data",
  },
  {
    slug: "cancer",
    name: "Cancer",
    short: "Cancer",
    condition: "breast cancer",
    focus: "Oncology trial discovery across subtype, stage and prior treatment",
    overview:
      "Oncology eligibility is layered: tumour subtype, stage, biomarker status, prior lines of therapy, performance status and laboratory thresholds all interact. It is the clearest example of why unknown information must stay unknown rather than being guessed.",
    conditions: [
      "Breast cancer",
      "Lung cancer",
      "Colorectal cancer",
      "Prostate cancer",
      "Leukemia",
      "Lymphoma",
    ],
    variables: [
      "Age",
      "Disease subtype",
      "Stage",
      "Biomarker status (where recorded)",
      "Previous treatment lines",
      "Performance status",
      "Laboratory values",
    ],
    criteria: [
      { label: "Histologically confirmed diagnosis", expected: "Present" },
      { label: "Stage", expected: "II–IV" },
      { label: "Biomarker status", expected: "Recorded" },
      { label: "Prior systemic therapy", expected: "≤ 2 lines" },
      { label: "Performance status", expected: "ECOG 0–1" },
    ],
    complexity: "Biomarker and staging fields are frequently missing — those criteria stay UNKNOWN.",
    dataStatus: "Synthetic research data",
  },
  {
    slug: "diabetes",
    name: "Diabetes",
    short: "Diabetes",
    condition: "type 2 diabetes",
    focus: "Metabolic studies driven by laboratory thresholds",
    overview:
      "Diabetes protocols lean on a small set of repeatable laboratory values, so eligibility logic is unusually explicit — and a useful baseline for comparing screening approaches.",
    conditions: ["Type 1 diabetes", "Type 2 diabetes", "Diabetic kidney disease", "Diabetic neuropathy"],
    variables: [
      "Age",
      "HbA1c",
      "Fasting glucose",
      "BMI",
      "Blood pressure",
      "Duration of disease",
      "Medication history",
      "Recorded complications",
    ],
    criteria: [
      { label: "Age", expected: "18–75 years" },
      { label: "HbA1c", expected: "7.0–10.5%" },
      { label: "BMI", expected: "25–45" },
      { label: "Duration of diagnosis", expected: "≥ 6 months" },
      { label: "Current insulin therapy", expected: "Protocol dependent" },
    ],
    complexity: "Thresholds are explicit; the challenge is value recency, not interpretation.",
    dataStatus: "Synthetic research data",
  },
  {
    slug: "stroke",
    name: "Stroke",
    short: "Stroke",
    condition: "stroke",
    focus: "Time-sensitive criteria and event history",
    overview:
      "Stroke protocols frequently include time windows relative to symptom onset. Time-based criteria are the ones most likely to be unresolvable from stored records, and the interface should say so rather than assume.",
    conditions: ["Ischemic stroke", "Hemorrhagic stroke", "Transient ischemic attack", "Stroke rehabilitation"],
    variables: [
      "Age",
      "Previous stroke history",
      "Blood pressure",
      "Time since documented event",
      "Relevant comorbidities",
      "Anticoagulant medication history",
    ],
    criteria: [
      { label: "Age", expected: "≥ 18 years" },
      { label: "Documented cerebrovascular event", expected: "Present" },
      { label: "Time since onset", expected: "Within protocol window" },
      { label: "Anticoagulant therapy", expected: "Protocol dependent" },
      { label: "Blood pressure", expected: "< 185/110 mmHg" },
    ],
    complexity: "Onset timing is often absent from structured data — those criteria remain UNKNOWN.",
    dataStatus: "Synthetic research data",
  },
  {
    slug: "kidney",
    name: "Kidney Disease",
    short: "Kidney",
    condition: "chronic kidney disease",
    focus: "Function-staged eligibility from laboratory values",
    overview:
      "Renal studies are staged on continuous measures such as eGFR and creatinine, so protocol text maps almost directly onto numeric comparisons.",
    conditions: ["Chronic kidney disease", "Diabetic nephropathy", "End-stage renal disease", "Glomerulonephritis"],
    variables: ["eGFR", "Creatinine", "Age", "Blood pressure", "Diabetes status", "Medication history"],
    criteria: [
      { label: "eGFR", expected: "20–60 mL/min/1.73m²" },
      { label: "Age", expected: "18–80 years" },
      { label: "Dialysis", expected: "Not currently receiving" },
      { label: "Diabetes status", expected: "Recorded" },
      { label: "Blood pressure", expected: "Controlled per protocol" },
    ],
    complexity: "Continuous values map cleanly to criteria; recency of the last lab matters.",
    dataStatus: "Synthetic research data",
  },
  {
    slug: "neurological",
    name: "Brain & Neurological",
    short: "Neurological",
    condition: "alzheimer disease",
    focus: "Discovery across progressive and episodic neurological conditions",
    overview:
      "Neurological protocols mix structured measures with assessment scores that may not exist in routine records. The workflow here is discovery and structured screening support — not diagnosis.",
    conditions: ["Alzheimer's disease", "Parkinson's disease", "Epilepsy", "Multiple sclerosis"],
    variables: [
      "Age",
      "Documented diagnosis",
      "Assessment scores (where recorded)",
      "Medication history",
      "Relevant comorbidities",
    ],
    criteria: [
      { label: "Age", expected: "50–90 years" },
      { label: "Documented diagnosis", expected: "Present" },
      { label: "Cognitive / motor assessment score", expected: "Within protocol range" },
      { label: "Concurrent investigational therapy", expected: "None" },
    ],
    complexity: "Assessment scores are commonly missing from structured data.",
    dataStatus: "Synthetic research data (limited)",
  },
  {
    slug: "respiratory",
    name: "Respiratory",
    short: "Respiratory",
    condition: "chronic obstructive pulmonary disease",
    focus: "Function tests, exacerbation history and inhaled therapy",
    overview:
      "Respiratory protocols combine spirometry with exacerbation history — a mix of continuous values and event counting.",
    conditions: ["COPD", "Asthma", "Pulmonary fibrosis", "Pulmonary hypertension"],
    variables: [
      "Age",
      "Smoking history",
      "Spirometry values (where recorded)",
      "Exacerbations in the last year",
      "Inhaled medication history",
    ],
    criteria: [
      { label: "Age", expected: "40–80 years" },
      { label: "Documented diagnosis", expected: "Present" },
      { label: "Exacerbations in last 12 months", expected: "≥ 1" },
      { label: "Current smoking status", expected: "Recorded" },
    ],
    complexity: "Spirometry is often unavailable outside specialist care.",
    dataStatus: "Synthetic research data (limited)",
  },
  {
    slug: "rare-disease",
    name: "Rare Diseases",
    short: "Rare",
    condition: "rare disease",
    focus: "Small eligible populations spread across many sites",
    overview:
      "Rare disease recruitment is the hardest case: very few potentially eligible people, distributed across many sites and registries. Structured screening matters most where the population is smallest.",
    conditions: ["Genetic metabolic disorders", "Neuromuscular disorders", "Rare haematological disorders"],
    variables: [
      "Age",
      "Confirmed diagnosis code",
      "Genetic finding (where recorded)",
      "Relevant laboratory values",
      "Prior treatment history",
    ],
    criteria: [
      { label: "Confirmed diagnosis", expected: "Present" },
      { label: "Genetic confirmation", expected: "Where required by protocol" },
      { label: "Age", expected: "Protocol dependent" },
      { label: "Prior treatment", expected: "Recorded" },
    ],
    complexity: "Tiny candidate pools; a single UNKNOWN can remove the only potential match.",
    dataStatus: "Synthetic research data (limited)",
  },
];

export function getDisease(slug: string): Disease | undefined {
  return diseases.find((d) => d.slug === slug);
}
