/* ============================================================
   UniCode — synthetic multi-CPSE demo dataset
   This mirrors the approach described in the team's reference
   doc: real industrial item types, 2-4 differently-coded /
   differently-worded versions each, written as if entered
   independently by different CPSEs. No real CPSE or SAP data
   is used anywhere in this prototype.
   ============================================================ */

const CPSE_NAMES = {
  ONGC: "Oil & Natural Gas Corporation",
  IOCL: "Indian Oil Corporation Ltd",
  NTPC: "NTPC Ltd",
  SAIL: "Steel Authority of India Ltd",
  BHEL: "Bharat Heavy Electricals Ltd",
  GAIL: "GAIL (India) Ltd",
  COAL: "Coal India Ltd",
};

/* Common abbreviation expansions used by the in-browser matching
   simulation (Try the Matcher view) — mirrors the "Cleaning &
   Normalization" step (Step 2) of the methodology in the reference
   doc: expanding abbreviations before comparison. This is a stand-in
   for the real SBERT + cosine-similarity microservice. */
const ABBREVIATIONS = {
  ss: "stainless steel",
  ms: "mild steel",
  cs: "carbon steel",
  ci: "cast iron",
  di: "ductile iron",
  gi: "galvanized iron",
  swg: "spiral wound gasket",
  dgbb: "deep groove ball bearing",
  tpn: "triple pole neutral",
  rf: "raised face",
  sch: "schedule",
  thk: "thickness",
  nb: "nominal bore",
  arm: "armoured",
  armd: "armoured",
  amp: "ampere",
  ph: "phase",
  cl: "class",
  hlm: "helmet",
  hrn: "harness",
  glv: "gloves",
};

/* Weekly demo trend for the ₹ Impact Simulator — illustrative only,
   consistent with the totals in MATERIAL_GROUPS below (final week
   matches the sum of all "approved" blockedCapital figures). */
const IMPACT_TREND = [
  { week: "Wk1", capital: 400000 },
  { week: "Wk2", capital: 900000 },
  { week: "Wk3", capital: 1500000 },
  { week: "Wk4", capital: 2000000 },
  { week: "Wk5", capital: 2450000 },
  { week: "Wk6", capital: 2900000 },
  { week: "Wk7", capital: 3250000 },
  { week: "Wk8", capital: 3580000 },
];

/* External standards UniCode aligns to — see reference doc §8. */
const STANDARDS = [
  { name: "UNSPSC", full: "United Nations Standard Products and Services Code", url: "https://www.undp.org/unspsc", note: "Target classification taxonomy our category tree is designed to stay compatible with." },
  { name: "GS1 GPC", full: "Global Product Classification", url: "https://www.gs1.org/standards/gpc/how-gpc-works", note: "A proven external product-categorization framework, used the same way as UNSPSC." },
  { name: "ISO 8000-100", full: "Master data quality", url: "https://www.iso.org/standard/62392.html", note: "Grounds our \"clean, standardized, trustworthy material master\" goal in a formal data-governance standard." },
  { name: "NIST AI RMF 1.0", full: "AI Risk Management Framework", url: "https://www.nist.gov/itl/ai-risk-management-framework", note: "Basis for keeping a human in the loop before any match is finalized." },
];

/* Glossary — condensed from reference doc §7, for the About page. */
const GLOSSARY = [
  { term: "CPSE", def: "Central Public Sector Enterprise — a government-owned company with 51%+ central government stake (e.g. ONGC, NTPC, IOCL). Each runs its own independent ERP/SAP system." },
  { term: "National Material Code (NMC)", def: "The single standardized code generated once multiple CPSE-specific codes are confirmed to represent the same material." },
  { term: "Embedding", def: "A way of converting text into a list of numbers such that texts with similar meaning end up numerically close together, even if the words differ." },
  { term: "SBERT (Sentence-BERT)", def: "A version of BERT optimized to produce sentence-level embeddings that can be compared for similarity quickly across thousands of records." },
  { term: "Cosine Similarity", def: "A way of measuring how similar two vectors are based on the angle between them. A score near 1 means near-identical meaning; near 0 means unrelated." },
  { term: "Material Passport", def: "The permanent digital identity record for a material — its origin CPSE, everywhere it's used, and how many duplicate purchases it has prevented." },
  { term: "Interchangeability Graph", def: "A graph connecting materials that aren't identical but can functionally substitute for one another, unlocking cross-CPSE collaborative procurement." },
  { term: "Human-in-the-Loop", def: "A design principle where AI proposes a match but a human must explicitly approve, reject, or modify it before anything is finalized." },
];

/* status: "approved" items already carry a live National Material
   Code. "pending" items are sitting in the human review queue —
   the AI has proposed a match but no officer has actioned it yet. */
const MATERIAL_GROUPS = [
  {
    nmc: "NMC-MECH-BLT-000125",
    status: "approved",
    category: "Mechanical",
    subtype: "Fasteners",
    name: "Stainless Steel Hex Bolt, M10 x 50mm, Grade A2-70",
    attributes: { Material: "Stainless Steel", Grade: "A2-70", Diameter: "M10", Length: "50 mm", Standard: "IS 1364" },
    records: [
      { cpse: "ONGC", code: "ONGC-BLT-102", raw: "SS Bolt M10 50mm", unitPrice: 42, qty: 1200 },
      { cpse: "IOCL", code: "IOCL-M-8821", raw: "Stainless Steel Bolt M10x50", unitPrice: 45, qty: 800 },
      { cpse: "NTPC", code: "NTPC-4528", raw: "SS M10 Bolt 50 MM", unitPrice: 40, qty: 950 },
    ],
    impact: { blockedCapital: 128000, savingsPct: 18, transferableUnits: 640 },
    interchangeable: [{ nmc: "NMC-MECH-BLT-000126", reason: "Same M10x50 dimensions in Grade A4-80 — higher corrosion resistance, functionally interchangeable outside marine service", score: 0.81 }],
  },
  {
    nmc: "NMC-MECH-BLT-000126",
    status: "approved",
    category: "Mechanical",
    subtype: "Fasteners",
    name: "Stainless Steel Hex Bolt, M10 x 50mm, Grade A4-80",
    attributes: { Material: "Stainless Steel", Grade: "A4-80", Diameter: "M10", Length: "50 mm", Standard: "IS 1364" },
    records: [
      { cpse: "SAIL", code: "SAIL-FAS-330", raw: "SS Bolt A4 M10 50", unitPrice: 51, qty: 400 },
      { cpse: "BHEL", code: "BHEL-B-1187", raw: "Bolt SS Grade A4 M10x50mm", unitPrice: 53, qty: 260 },
    ],
    impact: { blockedCapital: 34000, savingsPct: 14, transferableUnits: 180 },
    interchangeable: [{ nmc: "NMC-MECH-BLT-000125", reason: "Same M10x50 dimensions in Grade A2-70 — lower cost, interchangeable outside marine service", score: 0.81 }],
  },
  {
    nmc: "NMC-MECH-VLV-000210",
    status: "approved",
    category: "Mechanical",
    subtype: "Valves",
    name: "Gate Valve, DN150, Cast Iron, PN16",
    attributes: { Material: "Cast Iron", Type: "Gate Valve", Size: "DN150", Standard: "IS 780" },
    records: [
      { cpse: "IOCL", code: "IOCL-VLV-771", raw: "Gate Valve 150mm CI", unitPrice: 6200, qty: 40 },
      { cpse: "GAIL", code: "GAIL-GV-4402", raw: "CI Gate Valve DN150 PN16", unitPrice: 6050, qty: 22 },
      { cpse: "NTPC", code: "NTPC-VL-119", raw: "150mm Cast Iron Gate Valve", unitPrice: 6400, qty: 18 },
    ],
    impact: { blockedCapital: 540000, savingsPct: 22, transferableUnits: 45 },
    interchangeable: [{ nmc: "NMC-MECH-VLV-000211", reason: "Same DN150 gate valve in Ductile Iron — higher pressure rating, substitutable for non-critical lines", score: 0.77 }],
  },
  {
    nmc: "NMC-MECH-VLV-000211",
    status: "approved",
    category: "Mechanical",
    subtype: "Valves",
    name: "Gate Valve, DN150, Ductile Iron, PN25",
    attributes: { Material: "Ductile Iron", Type: "Gate Valve", Size: "DN150", Standard: "IS 780" },
    records: [
      { cpse: "SAIL", code: "SAIL-VLV-208", raw: "DI Gate Valve 150 PN25", unitPrice: 8100, qty: 15 },
      { cpse: "COAL", code: "CIL-VL-556", raw: "Gate Valve DN 150 Ductile Iron", unitPrice: 8300, qty: 11 },
    ],
    impact: { blockedCapital: 210000, savingsPct: 19, transferableUnits: 12 },
    interchangeable: [{ nmc: "NMC-MECH-VLV-000210", reason: "Same DN150 gate valve in Cast Iron — lower cost, substitutable for non-critical lines", score: 0.77 }],
  },
  {
    nmc: "NMC-MECH-BRG-000340",
    status: "approved",
    category: "Mechanical",
    subtype: "Bearings",
    name: "Deep Groove Ball Bearing, 6205, 25mm Bore",
    attributes: { Type: "Deep Groove Ball Bearing", Bore: "25 mm", Series: "6205", Standard: "ISO 15" },
    records: [
      { cpse: "ONGC", code: "ONGC-BRG-90", raw: "Ball Bearing 6205", unitPrice: 210, qty: 900 },
      { cpse: "BHEL", code: "BHEL-BR-2231", raw: "DGBB 6205 25mm bore", unitPrice: 195, qty: 700 },
      { cpse: "NTPC", code: "NTPC-BRG-77", raw: "Bearing 6205 Deep Groove", unitPrice: 205, qty: 650 },
      { cpse: "SAIL", code: "SAIL-BB-6205", raw: "6205 Ball Bearing 25 mm", unitPrice: 200, qty: 500 },
    ],
    impact: { blockedCapital: 76000, savingsPct: 15, transferableUnits: 310 },
    interchangeable: [],
  },
  {
    nmc: "NMC-ELEC-CBL-000610",
    status: "approved",
    category: "Electrical",
    subtype: "Cables",
    name: "XLPE Armoured Power Cable, 3.5C x 240 sq.mm",
    attributes: { Insulation: "XLPE", Cores: "3.5C", Size: "240 sq.mm", Armour: "Yes" },
    records: [
      { cpse: "NTPC", code: "NTPC-CBL-501", raw: "XLPE Armoured Cable 3.5Cx240", unitPrice: 1850, qty: 4200 },
      { cpse: "BHEL", code: "BHEL-CB-908", raw: "3.5 Core 240sqmm XLPE Cable Armoured", unitPrice: 1790, qty: 3100 },
      { cpse: "GAIL", code: "GAIL-CBL-267", raw: "Cable XLPE Arm 3.5C 240 sq mm", unitPrice: 1820, qty: 2600 },
    ],
    impact: { blockedCapital: 1850000, savingsPct: 12, transferableUnits: 8200 },
    interchangeable: [],
  },
  {
    nmc: "NMC-ELEC-SWG-000812",
    status: "approved",
    category: "Electrical",
    subtype: "Switchgear",
    name: "MCCB, 200A, TPN, 36kA",
    attributes: { Type: "MCCB", Rating: "200A", Poles: "TPN", Breaking: "36kA" },
    records: [
      { cpse: "BHEL", code: "BHEL-SW-77", raw: "MCCB 200A TPN 36kA", unitPrice: 9200, qty: 60 },
      { cpse: "NTPC", code: "NTPC-MC-204", raw: "200 Amp MCCB Triple Pole Neutral", unitPrice: 9500, qty: 45 },
      { cpse: "ONGC", code: "ONGC-SW-981", raw: "MCCB TPN 200A 36 kA", unitPrice: 9050, qty: 30 },
    ],
    impact: { blockedCapital: 315000, savingsPct: 17, transferableUnits: 55 },
    interchangeable: [{ nmc: "NMC-ELEC-SWG-000813", reason: "Same TPN MCCB frame family at the 250A rating — substitutable in the other direction wherever the extra headroom is welcome", score: 0.74 }],
  },
  {
    nmc: "NMC-ELEC-SWG-000813",
    status: "approved",
    category: "Electrical",
    subtype: "Switchgear",
    name: "MCCB, 250A, TPN, 36kA",
    attributes: { Type: "MCCB", Rating: "250A", Poles: "TPN", Breaking: "36kA" },
    records: [
      { cpse: "ONGC", code: "ONGC-SW-982", raw: "MCCB 250A TPN 36kA", unitPrice: 10400, qty: 25 },
      { cpse: "GAIL", code: "GAIL-MC-310", raw: "250 Amp MCCB Triple Pole Neutral", unitPrice: 10650, qty: 18 },
    ],
    impact: { blockedCapital: 187000, savingsPct: 15, transferableUnits: 18 },
    interchangeable: [{ nmc: "NMC-ELEC-SWG-000812", reason: "Same TPN MCCB frame family at the 200A rating — substitutable wherever 250A headroom isn't actually required", score: 0.74 }],
  },
  {
    nmc: "NMC-SAFE-HLM-000901",
    status: "approved",
    category: "Safety",
    subtype: "PPE",
    name: "Safety Helmet, Class E, ISI Marked",
    attributes: { Type: "Safety Helmet", Class: "E", Certification: "ISI" },
    records: [
      { cpse: "COAL", code: "CIL-HLM-12", raw: "Safety Helmet Class E ISI", unitPrice: 165, qty: 3000 },
      { cpse: "SAIL", code: "SAIL-SH-330", raw: "ISI Marked Helmet Class-E", unitPrice: 158, qty: 2200 },
      { cpse: "GAIL", code: "GAIL-HM-208", raw: "Helmet Safety Class E ISI Mark", unitPrice: 170, qty: 1400 },
      { cpse: "NTPC", code: "NTPC-HL-445", raw: "Class E Safety Helmet ISI", unitPrice: 160, qty: 1100 },
    ],
    impact: { blockedCapital: 34000, savingsPct: 20, transferableUnits: 1200 },
    interchangeable: [],
  },
  {
    nmc: "NMC-SAFE-HRN-001110",
    status: "approved",
    category: "Safety",
    subtype: "PPE",
    name: "Full Body Safety Harness, Dual Lanyard",
    attributes: { Type: "Full Body Harness", Lanyard: "Dual", Certification: "IS 3521" },
    records: [
      { cpse: "ONGC", code: "ONGC-HRN-14", raw: "Full Body Harness Dual Lanyard", unitPrice: 2400, qty: 300 },
      { cpse: "COAL", code: "CIL-SH-88", raw: "Safety Harness Full Body Dual", unitPrice: 2350, qty: 210 },
      { cpse: "SAIL", code: "SAIL-HR-220", raw: "Full-Body Harness, Dual Lanyard IS3521", unitPrice: 2450, qty: 150 },
    ],
    impact: { blockedCapital: 61000, savingsPct: 16, transferableUnits: 90 },
    interchangeable: [],
  },
  {
    nmc: "NMC-MECH-FLG-001205",
    status: "approved",
    category: "Mechanical",
    subtype: "Flanges",
    name: "Flange, DN150, Class 300, Raised Face",
    attributes: { Size: "DN150", Class: "300", Face: "Raised Face", Standard: "ASME B16.5" },
    records: [
      { cpse: "GAIL", code: "GAIL-FLG-66", raw: "Flange 150mm Cl300 RF", unitPrice: 3100, qty: 80 },
      { cpse: "IOCL", code: "IOCL-FL-902", raw: "RF Flange DN150 Class 300", unitPrice: 3050, qty: 60 },
      { cpse: "NTPC", code: "NTPC-FLG-330", raw: "Flange DN 150 300# Raised Face", unitPrice: 3200, qty: 40 },
    ],
    impact: { blockedCapital: 145000, savingsPct: 13, transferableUnits: 35 },
    interchangeable: [],
  },

  /* ---- pending: sitting in the human review queue ---- */
  {
    nmc: "NMC-MECH-GSK-000415 (proposed)",
    status: "pending",
    category: "Mechanical",
    subtype: "Gaskets",
    name: "Spiral Wound Gasket, DN100, 4.5mm Thickness",
    attributes: { Type: "Spiral Wound Gasket", Size: "DN100", Thickness: "4.5 mm", Standard: "ASME B16.20" },
    records: [
      { cpse: "IOCL", code: "IOCL-GSK-334", raw: "Spiral Wound Gasket 100mm 4.5mm thk", unitPrice: 380, qty: 500 },
      { cpse: "GAIL", code: "GAIL-SG-118", raw: "SWG DN100 4.5 mm ASME B16.20", unitPrice: 365, qty: 340 },
    ],
    matchScore: 0.88,
    aiNote: "Both records share identical size, thickness, and referenced standard (ASME B16.20). Description wording differs only in abbreviation style (\"Spiral Wound Gasket\" vs \"SWG\").",
    impact: { blockedCapital: 92000, savingsPct: 21, transferableUnits: 340 },
    interchangeable: [],
  },
  {
    nmc: "NMC-MECH-PIP-000502 (proposed)",
    status: "pending",
    category: "Mechanical",
    subtype: "Pipes",
    name: "MS Seamless Pipe, 6 inch, Schedule 40",
    attributes: { Material: "Mild Steel", Type: "Seamless Pipe", Size: "6 inch (NB150)", Schedule: "Sch 40" },
    records: [
      { cpse: "SAIL", code: "SAIL-PIPE-812", raw: "MS Seamless Pipe 6\" Sch40", unitPrice: 4200, qty: 220 },
      { cpse: "ONGC", code: "ONGC-PP-2290", raw: "Seamless MS Pipe 150NB SCH 40", unitPrice: 4350, qty: 160 },
      { cpse: "COAL", code: "CIL-PIPE-46", raw: "6 inch MS Pipe Seamless Sch-40", unitPrice: 4100, qty: 95 },
    ],
    matchScore: 0.91,
    aiNote: "All three records resolve to the same nominal bore (150NB = 6\") and schedule once units are normalised. Material and manufacturing process match exactly.",
    impact: { blockedCapital: 610000, savingsPct: 24, transferableUnits: 95 },
    interchangeable: [],
  },
  {
    nmc: "NMC-ELEC-MTR-000705 (proposed)",
    status: "pending",
    category: "Electrical",
    subtype: "Motors",
    name: "Induction Motor, 15kW, 415V, 3-Phase",
    attributes: { Type: "Induction Motor", Power: "15 kW", Voltage: "415 V", Phase: "3-Phase" },
    records: [
      { cpse: "SAIL", code: "SAIL-MTR-140", raw: "15kW Induction Motor 415V 3ph", unitPrice: 62000, qty: 12 },
      { cpse: "IOCL", code: "IOCL-M-3390", raw: "Induction Motor 15 KW 3 Phase 415 Volt", unitPrice: 63500, qty: 8 },
    ],
    matchScore: 0.86,
    aiNote: "Power rating, voltage, and phase count match exactly. Minor description variance is unit-ordering and capitalisation only.",
    impact: { blockedCapital: 508000, savingsPct: 11, transferableUnits: 8 },
    interchangeable: [],
  },
  {
    nmc: "NMC-SAFE-GLV-001005 (proposed)",
    status: "pending",
    category: "Safety",
    subtype: "PPE",
    name: "Nitrile Coated Safety Gloves, Size L",
    attributes: { Material: "Nitrile Coated", Size: "L" },
    records: [
      { cpse: "IOCL", code: "IOCL-GLV-55", raw: "Nitrile Safety Gloves Size L", unitPrice: 85, qty: 1800 },
      { cpse: "BHEL", code: "BHEL-GL-901", raw: "Safety Gloves Nitrile Coated L Size", unitPrice: 90, qty: 1200 },
    ],
    matchScore: 0.83,
    aiNote: "Same coating material and size. Score held below 0.85 because neither record specifies cuff length or grip pattern — flagged for officer confirmation before merge.",
    impact: { blockedCapital: 15300, savingsPct: 10, transferableUnits: 1200 },
    interchangeable: [],
  },
];

/* mutable review queue derived from MATERIAL_GROUPS — approving /
   rejecting / modifying here does not touch the static dataset above,
   so the demo can be reset by reloading the page. */
const REVIEW_QUEUE = MATERIAL_GROUPS.filter((g) => g.status === "pending").map((g) => ({ ...g, decided: false }));

/* Governance / audit log — most recent entry first. Seeded with
   backdated demo history; new entries get unshifted onto the front
   as the reviewer acts in the Match & Review queue or triggers an
   ERP sync, so the Dashboard and Audit Trail views stay in sync with
   what actually happened in this session. Resets on page reload. */
const SESSION_LOG = [
  { t: "10:42", type: "approve", text: "NMC-MECH-BLT-000125 approved — 3 legacy codes merged" },
  { t: "10:31", type: "approve", text: "NMC-ELEC-SWG-000813 approved — interchangeability link added to NMC-ELEC-SWG-000812" },
  { t: "10:15", type: "flag", text: "MS Seamless Pipe, 6 inch, Schedule 40 flagged for review — similarity 91%" },
  { t: "09:58", type: "approve", text: "NMC-MECH-VLV-000211 approved — interchangeability link added" },
  { t: "09:34", type: "approve", text: "NMC-SAFE-HRN-001110 approved — 3 legacy codes merged" },
  { t: "09:20", type: "flag", text: "Nitrile Coated Safety Gloves, Size L flagged for review — similarity 83%" },
  { t: "09:02", type: "approve", text: "NMC-MECH-FLG-001205 approved — 3 legacy codes merged" },
];
