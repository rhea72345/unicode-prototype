UniCode — SIH26099 Prototype
TechNexus

WHAT THIS IS
------------
A working, click-through prototype of the UniCode platform described in
the team's reference document. It demonstrates the full user experience
and workflow judges will want to see on stage, across ten screens:

  1. Dashboard             — national-level KPIs (materials tracked,
                              CPSEs connected, duplicates prevented,
                              capital unblocked) and a live activity log.
  2. Try the Matcher       — NEW. An interactive, in-browser semantic
                              matching demo. Type any raw material
                              description and watch the engine normalize
                              it (abbreviation expansion), tokenize it,
                              and score it against every material in the
                              catalogue with an attribute breakdown — this
                              is the "basic requirement" search-engine
                              demo every judge expects to see live, not
                              just described.
  3. Match & Review        — the AI-proposed duplicate matches, an
                              attribute-by-attribute comparison table, an
                              AI explanation for the score, and the
                              Approve / Reject / Modify human-in-the-loop
                              actions (Feature #9). Every decision now
                              writes to the shared session audit log.
  4. Material Passport     — the hero screen: pick a standardized
                              material, see its origin CPSE, every CPSE
                              currently using it, the real-time Rupee
                              Impact Simulator, the Interchangeability
                              Graph (USPs 1-3), and a "Sync to ERP"
                              button that opens a mock REST payload.
  5. Interchangeability    — NEW. A catalogue-wide network view of every
     Network                 interchangeability link found so far (not
                              just the one attached to whichever material
                              is currently open in the Passport), with
                              rollup KPIs (pairs found, families involved,
                              average substitution confidence).
  6. Classification        — NEW. The auto-categorization tree (Feature
                              #5) — Category → Sub-type → material —
                              exactly the "Mechanical → Fasteners → Bolts"
                              structure described in the pitch script,
                              clickable/expandable, tagged Live/Pending.
  7. Code Mapping          — every National Material Code with its
                              legacy CPSE codes preserved and linked,
                              never overwritten (Feature #7), now with a
                              per-row "Sync →" action to the mock ERP
                              endpoint.
  8. Impact Simulator      — NEW. A dedicated national rollup for USP #2:
                              total capital unblocked vs. still pending,
                              a demo trend line, blocked capital by
                              category, a top-5 highest-impact ranking,
                              and an interactive "project to full CPSE
                              scale" slider (this demo covers 7 CPSEs;
                              India has 250+).
  9. Audit Trail           — NEW. The full, filterable governance log
                              (approvals / rejections / modified
                              approvals / AI flags) that Q&A answers
                              point to when judges ask about CAG-ready
                              audit trails and ISO 8000-100.
 10. About & Standards     — NEW. An in-app quick-reference card: the
                              one-line pitch, the three USPs, the tech
                              stack table, links to the external
                              standards UniCode aligns to (UNSPSC, GS1
                              GPC, ISO 8000-100, NIST AI RMF), and a
                              glossary — handy to have open during Q&A
                              without digging through the PDF.

HOW TO RUN IT
-------------
No install, no server, no build step. Unzip the folder and open
index.html in any modern browser (Chrome, Edge, Firefox). That's it.

This also means it will run with zero risk of a live demo failing on
unreliable venue Wi-Fi — the only thing that needs the internet is the
Google Fonts request in css/styles.css (falls back to clean system
fonts automatically) and the "reference" links on the About page.

WHAT'S REAL VS SIMULATED (be upfront about this if a judge asks)
------------------------------------------------------------------
- The dataset is synthetic: ~16 real industrial item types (bolts,
  valves, bearings, cables, gaskets, PPE, motors, switchgear, etc.),
  each written as 2-4 differently-worded, differently-coded versions,
  exactly the way the reference doc describes building a demo dataset
  without needing real CPSE/SAP access.
- Match & Review's similarity scores and AI explanations are
  pre-computed for the demo, not produced by a live SBERT call.
- Try the Matcher IS live and interactive, but it's a light-weight
  stand-in for SBERT + cosine similarity: weighted, abbreviation-
  expanded token overlap computed instantly in the browser. Say this
  plainly if asked — "the workflow and the interaction are real, the
  model is simulated for the demo."
- The Approve / Reject / Modify actions are fully interactive and
  update in-memory state live (the pending badge, the audit trail, the
  queue list, the dashboard feed) — reload the page to reset the demo.
- "Sync to ERP" opens a real modal with a real generated JSON payload,
  but the "Send" button hits nothing — it's a mocked REST call, exactly
  as the reference doc describes for the hackathon prototype.

WHAT A REAL DEPLOYMENT WOULD ADD (per the team's architecture doc)
--------------------------------------------------------------------
- Node.js/Express + MongoDB backend to persist material records
- A Python/FastAPI microservice running actual SBERT embeddings +
  cosine similarity for live matching, instead of the simulated matcher
- A real, authenticated REST sync to each CPSE's SAP/ERP instance
- Auth, full audit-log persistence, and role-based access for the
  human review step (Procurement Officer / Inventory Manager / Finance
  & Audit / Ministry board, as covered in Impact & Benefits)

FILES
-----
index.html        page shell + sidebar navigation
css/styles.css     design system (all styling lives here)
js/data.js         the synthetic multi-CPSE dataset + standards/glossary
                    reference data + the mutable session audit log
js/app.js          view rendering + interactivity, no dependencies
