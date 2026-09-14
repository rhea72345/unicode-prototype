/* ============================================================
   UniCode prototype — app shell
   Vanilla JS, no build step. State lives in memory only; reload
   the page to reset the demo (matches the "nothing merges without
   review, nothing is silently persisted" governance story).
   ============================================================ */

const VIEWS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "matcher", label: "Try the Matcher" },
  { id: "review", label: "Match & Review", badge: () => REVIEW_QUEUE.filter((r) => !r.decided).length },
  { id: "passport", label: "Material Passport" },
  { id: "network", label: "Interchangeability" },
  { id: "classify", label: "Classification" },
  { id: "mapping", label: "Code Mapping" },
  { id: "impact", label: "Impact Simulator" },
  { id: "audit", label: "Audit Trail" },
  { id: "about", label: "About & Standards" },
];

let currentView = "dashboard";
let selectedQueueId = null;
let selectedPassportNmc = null;
let auditFilter = "all";
let scaleFactor = 25;

/* ---------- helpers ---------- */

function inr(n) {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

function approvedGroups() {
  return MATERIAL_GROUPS.filter((g) => g.status === "approved");
}

function allRecordsCount() {
  return MATERIAL_GROUPS.reduce((sum, g) => sum + g.records.length, 0);
}

function uniqueCpses() {
  const set = new Set();
  MATERIAL_GROUPS.forEach((g) => g.records.forEach((r) => set.add(r.cpse)));
  return set.size;
}

function el(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

function logEvent(type, text) {
  const t = new Date().toTimeString().slice(0, 5);
  SESSION_LOG.unshift({ t, type, text });
}

/* ---------- simple modal ---------- */

function openModal(contentEl) {
  closeModal();
  const overlay = el(`<div class="modal-overlay" id="modal-overlay"></div>`);
  const box = el(`<div class="modal-box"></div>`);
  box.appendChild(contentEl);
  overlay.appendChild(box);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });
  document.body.appendChild(overlay);
}

function closeModal() {
  const existing = document.getElementById("modal-overlay");
  if (existing) existing.remove();
}

/* ---------- nav / router ---------- */

function renderNav() {
  const nav = document.getElementById("nav");
  nav.innerHTML = "";
  VIEWS.forEach((v) => {
    const btn = document.createElement("button");
    btn.className = "nav-item" + (v.id === currentView ? " active" : "");
    const badgeCount = v.badge ? v.badge() : 0;
    btn.innerHTML = `<span>${v.label}</span>` + (badgeCount ? `<span class="nav-badge">${badgeCount}</span>` : "");
    btn.addEventListener("click", () => {
      currentView = v.id;
      render();
    });
    nav.appendChild(btn);
  });
}

function render() {
  renderNav();
  const main = document.getElementById("main");
  main.innerHTML = "";
  if (currentView === "dashboard") main.appendChild(renderDashboard());
  if (currentView === "matcher") main.appendChild(renderMatcher());
  if (currentView === "review") main.appendChild(renderReview());
  if (currentView === "passport") main.appendChild(renderPassport());
  if (currentView === "network") main.appendChild(renderNetwork());
  if (currentView === "classify") main.appendChild(renderClassify());
  if (currentView === "mapping") main.appendChild(renderMapping());
  if (currentView === "impact") main.appendChild(renderImpact());
  if (currentView === "audit") main.appendChild(renderAudit());
  if (currentView === "about") main.appendChild(renderAbout());
}

/* ============================================================
   DASHBOARD
   ============================================================ */

function renderDashboard() {
  const approved = approvedGroups();
  const totalRecords = allRecordsCount();
  const totalStandardized = approved.length;
  const totalDuplicatesPrevented = approved.reduce((s, g) => s + (g.records.length - 1), 0);
  const totalBlocked = approved.reduce((s, g) => s + g.impact.blockedCapital, 0);
  const pendingCount = REVIEW_QUEUE.filter((r) => !r.decided).length;

  const byCategory = {};
  MATERIAL_GROUPS.forEach((g) => {
    byCategory[g.category] = (byCategory[g.category] || 0) + g.records.length;
  });
  const maxCat = Math.max(...Object.values(byCategory));

  const wrap = el(`<div>
    <div class="page-head">
      <h1>National overview</h1>
      <span class="demo-tag">synthetic dataset</span>
    </div>
    <p class="page-note">Live state of material standardization across connected CPSEs. Figures update as matches move through review.</p>

    <div class="kpi-row">
      <div class="kpi">
        <div class="kpi-label">Material records ingested</div>
        <div class="kpi-value">${totalRecords}</div>
        <div class="kpi-sub">across ${uniqueCpses()} CPSEs</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Standardized (live NMCs)</div>
        <div class="kpi-value amber">${totalStandardized}</div>
        <div class="kpi-sub">${totalDuplicatesPrevented} duplicate codes merged</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Pending human review</div>
        <div class="kpi-value rust">${pendingCount}</div>
        <div class="kpi-sub">AI-proposed, awaiting officer decision</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Capital unblocked (approved)</div>
        <div class="kpi-value green">${inr(totalBlocked)}</div>
        <div class="kpi-sub">redundant stock identified</div>
      </div>
    </div>

    <div class="two-col">
      <div class="panel">
        <div class="panel-title">Records by category</div>
        <div id="cat-bars"></div>
      </div>
      <div class="panel">
        <div class="panel-title">Recent governance activity</div>
        <div id="activity-log"></div>
      </div>
    </div>
  </div>`);

  const barsHost = wrap.querySelector("#cat-bars");
  Object.entries(byCategory).forEach(([cat, count]) => {
    const pct = Math.round((count / maxCat) * 100);
    barsHost.appendChild(el(`<div class="bar-row">
      <div>${cat}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
      <div class="bar-count">${count}</div>
    </div>`));
  });

  const logHost = wrap.querySelector("#activity-log");
  SESSION_LOG.slice(0, 5).forEach((e) => {
    logHost.appendChild(el(`<div class="log-row">
      <div class="log-time">${e.t}</div>
      <div class="log-dot ${e.type === "approve" ? "" : "rust"}"></div>
      <div>${e.text}</div>
    </div>`));
  });

  return wrap;
}

/* ============================================================
   MATCH & REVIEW
   ============================================================ */

function renderReview() {
  const wrap = el(`<div>
    <div class="page-head"><h1>Match &amp; review queue</h1></div>
    <p class="page-note">The engine proposes a match with a similarity score and an attribute-level breakdown. Nothing merges into a National Material Code until an officer approves, rejects, or modifies it here.</p>
    <div class="two-col" id="review-cols"></div>
  </div>`);

  const cols = wrap.querySelector("#review-cols");
  const listPanel = el(`<div class="panel"><div class="panel-title">Proposed matches</div><div class="queue-list" id="queue-list"></div></div>`);
  const detailPanel = el(`<div class="panel" id="detail-panel"><div class="panel-title">Match detail</div><div id="detail-body"></div></div>`);
  cols.appendChild(listPanel);
  cols.appendChild(detailPanel);

  const listHost = listPanel.querySelector("#queue-list");
  if (!selectedQueueId) {
    const firstOpen = REVIEW_QUEUE.find((r) => !r.decided);
    selectedQueueId = firstOpen ? firstOpen.nmc : REVIEW_QUEUE[0].nmc;
  }

  REVIEW_QUEUE.forEach((item) => {
    const scoreClass = item.matchScore >= 0.88 ? "high" : "mid";
    const row = el(`<div class="queue-item ${item.nmc === selectedQueueId ? "selected" : ""} ${item.decided ? "done" : ""}">
      <div class="queue-item-top">
        <div class="queue-name">${item.name}</div>
        <div class="score-chip ${scoreClass}">${(item.matchScore * 100).toFixed(0)}%</div>
      </div>
      <div class="queue-meta">${item.records.length} CPSE records · ${item.category} / ${item.subtype}${item.decided ? " · " + item.decision : ""}</div>
    </div>`);
    row.addEventListener("click", () => {
      selectedQueueId = item.nmc;
      render();
    });
    listHost.appendChild(row);
  });

  const detailBody = detailPanel.querySelector("#detail-body");
  const item = REVIEW_QUEUE.find((r) => r.nmc === selectedQueueId);
  detailBody.appendChild(renderReviewDetail(item));

  return wrap;
}

function renderReviewDetail(item) {
  const attrKeys = Object.keys(item.attributes);
  const detail = el(`<div>
    <div class="passport-code">${item.nmc}</div>
    <div style="font-size:15px;font-weight:600;margin:4px 0 14px;">${item.name}</div>

    <table class="attr-table">
      <thead><tr><th>CPSE</th><th>Legacy code</th><th>Raw description</th>${attrKeys.map((k) => `<th>${k}</th>`).join("")}</tr></thead>
      <tbody>
        ${item.records.map((r) => `<tr>
          <td>${r.cpse}</td>
          <td class="code">${r.code}</td>
          <td>${r.raw}</td>
          ${attrKeys.map((k) => `<td>${item.attributes[k]}</td>`).join("")}
        </tr>`).join("")}
      </tbody>
    </table>

    <div class="ai-note"><strong>AI explanation —</strong> ${item.aiNote}</div>

    <div class="action-row" id="action-row"></div>
    <div id="decision-note"></div>
  </div>`);

  const actionRow = detail.querySelector("#action-row");
  const noteHost = detail.querySelector("#decision-note");

  if (item.decided) {
    noteHost.appendChild(el(`<div class="decision-note">Decision recorded: <strong>${item.decision}</strong>${item.modifiedCode ? ` — code set to ${item.modifiedCode}` : ""}. Reload the page to reset the demo.</div>`));
    return detail;
  }

  const approveBtn = el(`<button class="btn primary">Approve</button>`);
  const rejectBtn = el(`<button class="btn ghost-rust">Reject</button>`);
  const modifyInput = el(`<input class="modify-input" type="text" placeholder="Modify proposed NMC before approving" value="${item.nmc.replace(" (proposed)", "")}">`);
  const modifyBtn = el(`<button class="btn">Approve with modified code</button>`);

  approveBtn.addEventListener("click", () => {
    item.decided = true;
    item.decision = "Approved";
    logEvent("approve", `${item.nmc.replace(" (proposed)", "")} approved — ${item.records.length} legacy codes merged`);
    render();
  });
  rejectBtn.addEventListener("click", () => {
    item.decided = true;
    item.decision = "Rejected";
    logEvent("reject", `${item.name} match rejected by reviewing officer`);
    render();
  });
  modifyBtn.addEventListener("click", () => {
    item.decided = true;
    item.decision = "Approved (modified)";
    item.modifiedCode = modifyInput.value;
    logEvent("modify", `${item.modifiedCode} approved (modified from ${item.nmc.replace(" (proposed)", "")})`);
    render();
  });

  actionRow.appendChild(approveBtn);
  actionRow.appendChild(rejectBtn);
  actionRow.appendChild(modifyInput);
  actionRow.appendChild(modifyBtn);

  return detail;
}

/* ============================================================
   MATERIAL PASSPORT
   ============================================================ */

function renderPassport() {
  const approved = approvedGroups();
  if (!selectedPassportNmc) selectedPassportNmc = approved[0].nmc;
  const group = approved.find((g) => g.nmc === selectedPassportNmc) || approved[0];

  const wrap = el(`<div>
    <div class="page-head"><h1>Material passport</h1></div>
    <p class="page-note">Permanent digital identity for a standardized material — origin, every CPSE currently holding it, the financial impact of merging it, and functionally interchangeable alternatives.</p>
    <div class="select-row">
      <select id="passport-select"></select>
    </div>
    <div id="passport-card-host"></div>
  </div>`);

  const select = wrap.querySelector("#passport-select");
  approved.forEach((g) => {
    const opt = document.createElement("option");
    opt.value = g.nmc;
    opt.textContent = `${g.nmc} — ${g.name}`;
    if (g.nmc === group.nmc) opt.selected = true;
    select.appendChild(opt);
  });
  select.addEventListener("change", () => {
    selectedPassportNmc = select.value;
    render();
  });

  wrap.querySelector("#passport-card-host").appendChild(renderPassportCard(group));
  return wrap;
}

function renderPassportCard(group) {
  const originCpse = group.records[0].cpse;
  const totalQty = group.records.reduce((s, r) => s + r.qty, 0);

  const card = el(`<div class="passport-card">
    <div class="passport-top-row">
      <div>
        <div class="passport-code">${group.nmc}</div>
        <div class="passport-name">${group.name}</div>
      </div>
      <button class="btn" id="erp-sync-btn">Sync to ERP →</button>
    </div>

    <div class="impact-grid">
      <div class="impact-cell">
        <div class="impact-label">Blocked capital identified</div>
        <div class="impact-value">${inr(group.impact.blockedCapital)}</div>
      </div>
      <div class="impact-cell">
        <div class="impact-label">Procurement savings</div>
        <div class="impact-value">${group.impact.savingsPct}%</div>
      </div>
      <div class="impact-cell">
        <div class="impact-label">Transferable units</div>
        <div class="impact-value">${group.impact.transferableUnits.toLocaleString("en-IN")}</div>
      </div>
    </div>

    <div class="section-label">Origin &amp; usage across CPSEs (${totalQty.toLocaleString("en-IN")} units on record)</div>
    <div class="usage-list" id="usage-list"></div>

    <div class="section-label">Interchangeability graph</div>
    <div id="graph-host"></div>
  </div>`);

  card.querySelector("#erp-sync-btn").addEventListener("click", () => openModal(buildErpSyncModal(group)));

  const usageHost = card.querySelector("#usage-list");
  usageHost.appendChild(el(`<div class="usage-row">
    <div>CPSE</div><div class="usage-code">Legacy code</div><div>Raw description</div><div class="usage-qty">Qty</div>
  </div>`));
  group.records.forEach((r, i) => {
    usageHost.appendChild(el(`<div class="usage-row">
      <div title="${CPSE_NAMES[r.cpse] || ""}">${r.cpse}${i === 0 ? " (origin)" : ""}</div>
      <div class="usage-code">${r.code}</div>
      <div>${r.raw}</div>
      <div class="usage-qty">${r.qty.toLocaleString("en-IN")}</div>
    </div>`));
  });

  card.querySelector("#graph-host").appendChild(renderInterchangeGraph(group));
  return card;
}

function renderInterchangeGraph(group) {
  if (!group.interchangeable.length) {
    return el(`<div class="graph-empty">No functionally interchangeable materials flagged for this NMC yet.</div>`);
  }

  const w = 640, h = 220, cx = 130, cy = h / 2;
  const n = group.interchangeable.length;
  const spanY = Math.min(160, n * 70);
  let svgNodes = "", svgLines = "";

  const cBlue = "#6FA8DC", cFaint = "#5D7093", cPanelAlt = "#182A44", cAmber = "#D9A441", cText = "#E7EDF6", cMuted = "#90A3BE";

  group.interchangeable.forEach((link, i) => {
    const nx = w - 170;
    const ny = n === 1 ? cy : cy - spanY / 2 + (spanY / (n - 1)) * i;
    svgLines += `<line x1="${cx + 62}" y1="${cy}" x2="${nx - 62}" y2="${ny}" style="stroke:${cBlue};stroke-width:1.5;stroke-dasharray:4 3;opacity:0.7" />`;
    svgLines += `<text x="${(cx + nx) / 2}" y="${(cy + ny) / 2 - 8}" style="fill:${cFaint};font-size:11px;font-family:'IBM Plex Mono',monospace" text-anchor="middle">${Math.round(link.score * 100)}% sim</text>`;
    svgNodes += `<g>
      <rect x="${nx - 62}" y="${ny - 22}" width="124" height="44" rx="3" style="fill:${cPanelAlt};stroke:${cBlue}" />
      <text x="${nx}" y="${ny - 4}" style="fill:${cText};font-size:10.5px;font-family:'IBM Plex Mono',monospace" text-anchor="middle">${link.nmc}</text>
      <text x="${nx}" y="${ny + 12}" style="fill:${cFaint};font-size:9.5px" text-anchor="middle">substitute</text>
    </g>`;
  });

  const svg = `<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" xmlns="http://www.w3.org/2000/svg">
    ${svgLines}
    <rect x="${cx - 62}" y="${cy - 24}" width="124" height="48" rx="3" style="fill:${cAmber};opacity:0.15;stroke:${cAmber}" />
    <text x="${cx}" y="${cy - 4}" style="fill:${cAmber};font-size:10.5px;font-family:'IBM Plex Mono',monospace" text-anchor="middle">${group.nmc}</text>
    <text x="${cx}" y="${cy + 13}" style="fill:${cMuted};font-size:9.5px" text-anchor="middle">selected material</text>
    ${svgNodes}
  </svg>`;

  const wrap = el(`<div><div class="graph-wrap">${svg}</div><div class="graph-legend-list" id="legend"></div></div>`);
  const legend = wrap.querySelector("#legend");
  group.interchangeable.forEach((link) => {
    legend.appendChild(el(`<div class="graph-legend-row"><b>${link.nmc}</b> — ${link.reason}</div>`));
  });
  return wrap;
}

/* ============================================================
   ERP / SAP SYNC (mock)
   ============================================================ */

function buildErpSyncModal(group) {
  const payload = {
    endpoint: `POST /api/v1/erp/sync/${group.nmc}`,
    nationalMaterialCode: group.nmc,
    name: group.name,
    category: group.category,
    subtype: group.subtype,
    attributes: group.attributes,
    legacyCodeMap: group.records.map((r) => ({ cpse: r.cpse, legacyCode: r.code })),
  };

  const content = el(`<div class="modal-content">
    <div class="panel-title"><span>Sync to SAP / ERP</span><button class="btn modal-x" id="modal-close">✕</button></div>
    <p style="font-size:12.5px;color:var(--text-faint);margin:0 0 12px;">Mock REST endpoint — demonstrates the integration pattern in our architecture (pipeline step 9). No live CPSE SAP instance is contacted; a real deployment would authenticate and push through the CPSE's own SAP layer.</p>
    <pre class="json-preview">${JSON.stringify(payload, null, 2)}</pre>
    <div class="action-row" id="erp-action-row"></div>
  </div>`);

  content.querySelector("#modal-close").addEventListener("click", closeModal);

  const actionRow = content.querySelector("#erp-action-row");
  const sendBtn = el(`<button class="btn primary">Send to mock endpoint</button>`);
  sendBtn.addEventListener("click", () => {
    sendBtn.disabled = true;
    sendBtn.textContent = "Syncing…";
    setTimeout(() => {
      const now = new Date().toTimeString().slice(0, 5);
      actionRow.appendChild(el(`<span class="sync-success">✓ Synced to mock SAP endpoint at ${now}</span>`));
      logEvent("approve", `${group.nmc} pushed to mock ERP/SAP endpoint`);
      sendBtn.remove();
    }, 700);
  });
  actionRow.appendChild(sendBtn);

  return content;
}

/* ============================================================
   TRY THE MATCHER — in-browser semantic-match simulation
   ============================================================ */

const STOPWORDS = new Set(["a", "an", "the", "of", "for", "with", "and", "x"]);

function expandToken(tok) {
  return ABBREVIATIONS[tok] || tok;
}

function normalizeTokens(text) {
  let t = (text || "").toLowerCase();
  t = t.replace(/["'“”]/g, "");
  t = t.replace(/[,/]/g, " ");
  t = t.replace(/(\d+)([a-z]+)/g, "$1 $2");
  t = t.replace(/([a-z]+)(\d+)/g, "$1 $2");
  const raw = t.split(/\s+/).filter(Boolean);
  const tokens = [];
  raw.forEach((tok) => {
    if (STOPWORDS.has(tok)) return;
    expandToken(tok).split(" ").forEach((w) => tokens.push(w));
  });
  return tokens;
}

function tokenSet(text) {
  return new Set(normalizeTokens(text));
}

function isNumericToken(tok) {
  return /^\d+$/.test(tok);
}

function scoreAgainstGroup(inputTokens, group) {
  const groupText = [group.name, ...Object.values(group.attributes), ...group.records.map((r) => r.raw)].join(" ");
  const groupTokens = tokenSet(groupText);
  const allTokens = new Set([...inputTokens, ...groupTokens]);
  let overlapWeight = 0,
    unionWeight = 0;
  const matched = [];
  allTokens.forEach((tok) => {
    const w = isNumericToken(tok) ? 2.2 : 1;
    const inInput = inputTokens.has(tok);
    const inGroup = groupTokens.has(tok);
    if (inInput || inGroup) unionWeight += w;
    if (inInput && inGroup) {
      overlapWeight += w;
      if (tok.length > 1) matched.push(tok);
    }
  });
  const score = unionWeight === 0 ? 0 : overlapWeight / unionWeight;
  return { score, matched };
}

function runMatchSimulation(inputText) {
  const inputTokens = tokenSet(inputText);
  const results = MATERIAL_GROUPS.map((g) => {
    const { score, matched } = scoreAgainstGroup(inputTokens, g);
    return { group: g, score, matched };
  });
  results.sort((a, b) => b.score - a.score);
  return results;
}

function renderMatcher() {
  const wrap = el(`<div>
    <div class="page-head"><h1>Try the semantic matcher</h1><span class="demo-tag">simulated NLP</span></div>
    <p class="page-note">Type a raw material description the way a CPSE storekeeper might enter it — abbreviated, misordered, differently spelled. This runs the normalize → tokenize → compare pipeline from our methodology (steps 2–3), simplified to run instantly in the browser instead of calling the SBERT microservice.</p>
    <div class="matcher-input-row">
      <input type="text" id="matcher-input" placeholder="e.g. SS Bolt M10 50mm" autocomplete="off">
      <button class="btn primary" id="matcher-run">Run match</button>
    </div>
    <div class="matcher-examples">
      Try:
      <button class="chip-btn" data-ex="Stainless Bolt M10x50">Stainless Bolt M10x50</button>
      <button class="chip-btn" data-ex="CI Gate Valve 150 PN16">CI Gate Valve 150 PN16</button>
      <button class="chip-btn" data-ex="Nitrile Gloves L size">Nitrile Gloves L size</button>
      <button class="chip-btn" data-ex="Ceramic floor tile 60x60">Ceramic floor tile 60x60</button>
    </div>
    <div id="matcher-results"></div>
  </div>`);

  const input = wrap.querySelector("#matcher-input");
  const resultsHost = wrap.querySelector("#matcher-results");

  function runAndRender() {
    const text = input.value.trim();
    resultsHost.innerHTML = "";
    if (!text) return;
    resultsHost.appendChild(renderMatchResults(runMatchSimulation(text)));
  }

  wrap.querySelector("#matcher-run").addEventListener("click", runAndRender);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") runAndRender();
  });
  wrap.querySelectorAll(".chip-btn").forEach((b) => {
    b.addEventListener("click", () => {
      input.value = b.dataset.ex;
      runAndRender();
    });
  });

  return wrap;
}

function renderMatchResults(results) {
  const host = el(`<div></div>`);
  const shown = results.filter((r) => r.score >= 0.12).slice(0, 5);

  if (!shown.length) {
    host.appendChild(el(`<div class="panel"><div class="panel-title">No confident match</div>
      <p style="color:var(--text-muted);font-size:13px;margin:0;">None of the ${MATERIAL_GROUPS.length} existing National Material Codes overlap meaningfully with this description. AI recommendation: route to classification as a <strong>new material</strong> and assign a fresh NMC once a category is confirmed by an officer.</p>
    </div>`));
    return host;
  }

  shown.forEach((r, i) => {
    const pct = Math.round(r.score * 100);
    const verdict = r.score >= 0.55 ? { label: "Likely duplicate", cls: "high" } : r.score >= 0.3 ? { label: "Possible match — needs review", cls: "mid" } : { label: "Weak overlap", cls: "low" };
    const card = el(`<div class="panel match-result">
      <div class="panel-title">
        <span>${r.group.nmc}${i === 0 ? " — best match" : ""}</span>
        <span class="score-chip ${verdict.cls}">${pct}% similarity</span>
      </div>
      <div style="font-size:14px;font-weight:500;margin-bottom:6px;">${r.group.name}</div>
      <div class="verdict-tag ${verdict.cls}">${verdict.label}</div>
      <div class="matched-tokens"><span class="mt-label">Overlapping terms:</span> ${r.matched.slice(0, 10).map((t) => `<span class="tok">${t}</span>`).join(" ") || "—"}</div>
      <div class="section-label" style="margin:14px 0 8px;padding-top:12px;">Attributes on file</div>
      <div class="attr-chip-row">${Object.entries(r.group.attributes).map(([k, v]) => `<span class="attr-chip"><b>${k}:</b> ${v}</span>`).join("")}</div>
    </div>`);
    host.appendChild(card);
  });

  host.appendChild(el(`<p style="font-size:11.5px;color:var(--text-faint);margin-top:4px;">Simulation note: this in-browser demo uses weighted, abbreviation-expanded token overlap as a stand-in for the SBERT embedding + cosine similarity comparison used in the full pipeline — good enough to show the workflow, not the production model.</p>`));
  return host;
}

/* ============================================================
   INTERCHANGEABILITY NETWORK (all links, catalogue-wide)
   ============================================================ */

function renderNetwork() {
  const wrap = el(`<div>
    <div class="page-head"><h1>Interchangeability network</h1></div>
    <p class="page-note">Beyond exact duplicates, UniCode flags materials that aren't identical but can functionally substitute for one another — unlocking cross-CPSE collaborative procurement. This view lists every such link identified across the standardized catalogue so far.</p>
    <div id="network-kpis"></div>
    <div id="network-pairs"></div>
  </div>`);

  const pairs = [];
  const seen = new Set();
  MATERIAL_GROUPS.forEach((g) => {
    g.interchangeable.forEach((link) => {
      const key = [g.nmc, link.nmc].sort().join("::");
      if (seen.has(key)) return;
      seen.add(key);
      const target = MATERIAL_GROUPS.find((m) => m.nmc === link.nmc);
      if (target) pairs.push({ a: g, b: target, reason: link.reason, score: link.score });
    });
  });

  const kpiHost = wrap.querySelector("#network-kpis");
  const avgScore = pairs.length ? Math.round((pairs.reduce((s, p) => s + p.score, 0) / pairs.length) * 100) : 0;
  kpiHost.appendChild(el(`<div class="kpi-row" style="grid-template-columns:repeat(3,1fr);">
    <div class="kpi"><div class="kpi-label">Interchangeable pairs found</div><div class="kpi-value amber">${pairs.length}</div></div>
    <div class="kpi"><div class="kpi-label">Material families involved</div><div class="kpi-value">${new Set(pairs.flatMap((p) => [p.a.nmc, p.b.nmc])).size}</div></div>
    <div class="kpi"><div class="kpi-label">Avg substitution confidence</div><div class="kpi-value green">${avgScore}%</div></div>
  </div>`));

  const pairsHost = wrap.querySelector("#network-pairs");
  if (!pairs.length) {
    pairsHost.appendChild(el(`<div class="graph-empty">No interchangeability links identified yet.</div>`));
    return wrap;
  }

  pairs.forEach((p) => {
    const panel = el(`<div class="panel">
      <div class="panel-title"><span>${p.a.subtype} substitution</span><span class="score-chip mid">${Math.round(p.score * 100)}% substitutable</span></div>
      <div class="network-pair-host"></div>
      <div class="graph-legend-row" style="margin-top:12px;"><b>Why:</b> ${p.reason}</div>
    </div>`);
    panel.querySelector(".network-pair-host").appendChild(renderPairSvg(p.a, p.b, p.score));
    pairsHost.appendChild(panel);
  });

  return wrap;
}

function renderPairSvg(a, b, score) {
  const w = 640,
    h = 120,
    cy = h / 2;
  const leftX = 150,
    rightX = w - 150;
  const cBlue = "#6FA8DC",
    cAmber = "#D9A441",
    cPanelAlt = "#182A44",
    cFaint = "#5D7093";
  const svg = `<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <line x1="${leftX + 72}" y1="${cy}" x2="${rightX - 72}" y2="${cy}" style="stroke:${cBlue};stroke-width:1.5;stroke-dasharray:4 3;opacity:0.7" />
    <text x="${w / 2}" y="${cy - 10}" text-anchor="middle" style="fill:${cFaint};font-size:11px;font-family:'IBM Plex Mono',monospace">${Math.round(score * 100)}% sim</text>
    <rect x="${leftX - 72}" y="${cy - 24}" width="144" height="48" rx="3" style="fill:${cPanelAlt};stroke:${cAmber}" />
    <text x="${leftX}" y="${cy - 4}" text-anchor="middle" style="fill:${cAmber};font-size:10.5px;font-family:'IBM Plex Mono',monospace">${a.nmc}</text>
    <text x="${leftX}" y="${cy + 13}" text-anchor="middle" style="fill:${cFaint};font-size:9px;font-family:'IBM Plex Sans',sans-serif">${a.name.length > 30 ? a.name.slice(0, 28) + "…" : a.name}</text>
    <rect x="${rightX - 72}" y="${cy - 24}" width="144" height="48" rx="3" style="fill:${cPanelAlt};stroke:${cBlue}" />
    <text x="${rightX}" y="${cy - 4}" text-anchor="middle" style="fill:${cBlue};font-size:10.5px;font-family:'IBM Plex Mono',monospace">${b.nmc}</text>
    <text x="${rightX}" y="${cy + 13}" text-anchor="middle" style="fill:${cFaint};font-size:9px;font-family:'IBM Plex Sans',sans-serif">${b.name.length > 30 ? b.name.slice(0, 28) + "…" : b.name}</text>
  </svg>`;
  return el(`<div class="graph-wrap">${svg}</div>`);
}

/* ============================================================
   CLASSIFICATION TREE
   ============================================================ */

function renderClassify() {
  const wrap = el(`<div>
    <div class="page-head"><h1>Material classification</h1></div>
    <p class="page-note">Every material is auto-categorized into a tree — Category → Sub-type — the same shape of taxonomy UniCode aligns to UNSPSC / GS1 GPC for interoperability with existing government and industry standards.</p>
    <div id="tree-host"></div>
  </div>`);

  const tree = {};
  MATERIAL_GROUPS.forEach((g) => {
    tree[g.category] = tree[g.category] || {};
    tree[g.category][g.subtype] = tree[g.category][g.subtype] || [];
    tree[g.category][g.subtype].push(g);
  });

  const host = wrap.querySelector("#tree-host");
  Object.entries(tree).forEach(([cat, subs]) => {
    const catCount = Object.values(subs).flat().length;
    const details = el(`<details class="tree-node" open>
      <summary class="tree-cat"><span>${cat}</span><span class="tree-count">${catCount} material${catCount !== 1 ? "s" : ""}</span></summary>
      <div class="tree-children"></div>
    </details>`);
    const childHost = details.querySelector(".tree-children");
    Object.entries(subs).forEach(([sub, groups]) => {
      const subDetails = el(`<details class="tree-node sub">
        <summary class="tree-sub"><span>${sub}</span><span class="tree-count">${groups.length}</span></summary>
        <div class="tree-children"></div>
      </details>`);
      const leafHost = subDetails.querySelector(".tree-children");
      groups.forEach((g) => {
        leafHost.appendChild(el(`<div class="tree-leaf">
          <span class="status-pill ${g.status === "approved" ? "live" : "pending"}">${g.status === "approved" ? "Live" : "Pending"}</span>
          <span class="tree-leaf-name">${g.name}</span>
          <span class="tree-leaf-nmc">${g.nmc}</span>
        </div>`));
      });
      childHost.appendChild(subDetails);
    });
    host.appendChild(details);
  });

  return wrap;
}

/* ============================================================
   IMPACT SIMULATOR (national rollup + scale projection)
   ============================================================ */

function renderImpact() {
  const allGroups = MATERIAL_GROUPS;
  const approved = approvedGroups();
  const pending = REVIEW_QUEUE.filter((r) => !r.decided);
  const approvedTotal = approved.reduce((s, g) => s + g.impact.blockedCapital, 0);
  const pendingTotal = pending.reduce((s, g) => s + g.impact.blockedCapital, 0);
  const avgSavings = Math.round(allGroups.reduce((s, g) => s + g.impact.savingsPct, 0) / allGroups.length);
  const totalTransferable = allGroups.reduce((s, g) => s + g.impact.transferableUnits, 0);

  const byCategory = {};
  allGroups.forEach((g) => {
    byCategory[g.category] = (byCategory[g.category] || 0) + g.impact.blockedCapital;
  });
  const maxCatCapital = Math.max(...Object.values(byCategory));
  const topFive = [...allGroups].sort((a, b) => b.impact.blockedCapital - a.impact.blockedCapital).slice(0, 5);

  const wrap = el(`<div>
    <div class="page-head"><h1>₹ Impact simulator</h1><span class="demo-tag">synthetic dataset</span></div>
    <p class="page-note">Every duplicate we catch is translated into a rupee figure immediately, not shown as a bare similarity score — this is USP #2. Figures below are illustrative, computed on the synthetic demo dataset (7 CPSEs, ${allRecordsCount()} records); a live deployment would compute them from actual CPSE inventory valuation.</p>

    <div class="kpi-row">
      <div class="kpi"><div class="kpi-label">Capital unblocked (approved)</div><div class="kpi-value green">${inr(approvedTotal)}</div></div>
      <div class="kpi"><div class="kpi-label">Capital identified (pending)</div><div class="kpi-value rust">${inr(pendingTotal)}</div></div>
      <div class="kpi"><div class="kpi-label">Avg procurement savings</div><div class="kpi-value amber">${avgSavings}%</div></div>
      <div class="kpi"><div class="kpi-label">Transferable units, total</div><div class="kpi-value">${totalTransferable.toLocaleString("en-IN")}</div></div>
    </div>

    <div class="two-col">
      <div class="panel">
        <div class="panel-title">Cumulative capital unblocked (demo trend)</div>
        <div id="trend-host"></div>
      </div>
      <div class="panel">
        <div class="panel-title">Blocked capital by category</div>
        <div id="cat-impact-host"></div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-title">Top 5 highest-impact materials</div>
      <div id="top-five-host"></div>
    </div>

    <div class="panel">
      <div class="panel-title">Project to full CPSE scale</div>
      <p style="font-size:12.5px;color:var(--text-faint);margin:0 0 14px;">This demo dataset covers 7 CPSEs; India has well over 250. Drag the multiplier for a rough linear projection — not a modelled forecast, just a sense of scale.</p>
      <div class="scale-row">
        <input type="range" id="scale-slider" min="1" max="60" value="${scaleFactor}">
        <span id="scale-label"></span>
      </div>
      <div class="kpi-row" id="scale-kpis" style="margin-top:16px;"></div>
    </div>
  </div>`);

  wrap.querySelector("#trend-host").appendChild(renderTrendSvg());

  const catHost = wrap.querySelector("#cat-impact-host");
  Object.entries(byCategory).forEach(([cat, amt]) => {
    const pct = Math.round((amt / maxCatCapital) * 100);
    catHost.appendChild(el(`<div class="bar-row" style="grid-template-columns:100px 1fr 100px;">
      <div>${cat}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
      <div class="bar-count">${inr(amt)}</div>
    </div>`));
  });

  const topHost = wrap.querySelector("#top-five-host");
  topFive.forEach((g, i) => {
    topHost.appendChild(el(`<div class="log-row">
      <div class="log-time">#${i + 1}</div>
      <div class="log-dot ${g.status === "approved" ? "" : "rust"}"></div>
      <div>${g.name} <span style="color:var(--text-faint)">— ${g.nmc}</span></div>
      <div style="margin-left:auto;font-family:var(--mono);color:var(--green);">${inr(g.impact.blockedCapital)}</div>
    </div>`));
  });

  const slider = wrap.querySelector("#scale-slider");
  const label = wrap.querySelector("#scale-label");
  const scaleKpis = wrap.querySelector("#scale-kpis");

  function drawScale() {
    const f = Number(slider.value);
    scaleFactor = f;
    label.textContent = `${f}× (~${f * 7} CPSEs)`;
    scaleKpis.innerHTML = "";
    scaleKpis.appendChild(el(`<div class="kpi"><div class="kpi-label">Projected capital unblocked</div><div class="kpi-value green">${inr(approvedTotal * f)}</div></div>`));
    scaleKpis.appendChild(el(`<div class="kpi"><div class="kpi-label">Projected total identified</div><div class="kpi-value amber">${inr((approvedTotal + pendingTotal) * f)}</div></div>`));
    scaleKpis.appendChild(el(`<div class="kpi"><div class="kpi-label">Projected transferable units</div><div class="kpi-value">${Math.round(totalTransferable * f).toLocaleString("en-IN")}</div></div>`));
  }
  slider.addEventListener("input", drawScale);
  drawScale();

  return wrap;
}

function renderTrendSvg() {
  const w = 560,
    h = 180,
    pad = 30;
  const max = Math.max(...IMPACT_TREND.map((d) => d.capital));
  const stepX = (w - pad * 2) / (IMPACT_TREND.length - 1);
  const points = IMPACT_TREND.map((d, i) => {
    const x = pad + i * stepX;
    const y = h - pad - (d.capital / max) * (h - pad * 2);
    return [x, y];
  });
  const path = points.map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  const dots = points
    .map(
      (p, i) =>
        `<circle cx="${p[0]}" cy="${p[1]}" r="3" fill="#D9A441"/><text x="${p[0]}" y="${h - 6}" text-anchor="middle" font-size="9.5" fill="#5D7093" font-family="IBM Plex Mono">${IMPACT_TREND[i].week}</text>`
    )
    .join("");
  const svg = `<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <path d="${path}" fill="none" stroke="#6FA8DC" stroke-width="2"/>
    ${dots}
  </svg>`;
  return el(`<div class="graph-wrap">${svg}</div>`);
}

/* ============================================================
   AUDIT TRAIL
   ============================================================ */

function renderAudit() {
  const wrap = el(`<div>
    <div class="page-head"><h1>Audit trail</h1></div>
    <p class="page-note">Every AI flag and every human decision is logged — the CAG/audit-ready trail our reference doc ties to ISO 8000-100 and the human-in-the-loop principle.</p>
    <div class="select-row">
      <select id="audit-filter">
        <option value="all">All events</option>
        <option value="approve">Approvals</option>
        <option value="modify">Modified approvals</option>
        <option value="reject">Rejections</option>
        <option value="flag">AI flags</option>
      </select>
    </div>
    <div class="panel"><div id="audit-list"></div></div>
  </div>`);

  const select = wrap.querySelector("#audit-filter");
  select.value = auditFilter;
  const list = wrap.querySelector("#audit-list");

  function draw() {
    list.innerHTML = "";
    const filtered = SESSION_LOG.filter((e) => auditFilter === "all" || e.type === auditFilter);
    if (!filtered.length) {
      list.appendChild(el(`<div class="graph-empty">No events of this type yet.</div>`));
      return;
    }
    filtered.forEach((e) => {
      list.appendChild(el(`<div class="log-row">
        <div class="log-time">${e.t}</div>
        <div class="log-dot ${e.type === "approve" ? "" : "rust"}"></div>
        <div>${e.text}</div>
      </div>`));
    });
  }

  select.addEventListener("change", () => {
    auditFilter = select.value;
    draw();
  });
  draw();

  return wrap;
}

/* ============================================================
   ABOUT & STANDARDS
   ============================================================ */

function renderAbout() {
  const wrap = el(`<div>
    <div class="page-head"><h1>About &amp; standards</h1></div>
    <p class="page-note">Quick-reference sheet — the one-line pitch, our three USPs, tech stack, and the external standards UniCode aligns to. Handy during Q&amp;A.</p>

    <div class="panel">
      <div class="panel-title">One-line pitch</div>
      <p style="font-size:15px;font-style:italic;color:var(--text);margin:0;">"We don't just match materials — we give every material a national digital identity and an economic value."</p>
    </div>

    <div class="panel">
      <div class="panel-title">Three USPs</div>
      <div class="usp-grid">
        <div class="usp-card"><b>Material Passport</b><p>Permanent digital identity — origin, every CPSE using it, duplicate purchases prevented.</p></div>
        <div class="usp-card"><b>₹ Impact Simulator</b><p>Every duplicate is translated into blocked capital, savings %, and transferable units — not just a similarity score.</p></div>
        <div class="usp-card"><b>Interchangeability Graph</b><p>Flags functionally substitutable materials, not just exact duplicates — unlocking cross-CPSE procurement.</p></div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-title">Tech stack</div>
      <table class="map-table">
        <thead><tr><th>Layer</th><th>Technology</th><th>Why</th></tr></thead>
        <tbody id="stack-body"></tbody>
      </table>
    </div>

    <div class="panel">
      <div class="panel-title">Standards &amp; references we align to</div>
      <div id="standards-host"></div>
    </div>

    <div class="panel">
      <div class="panel-title">Glossary</div>
      <div id="glossary-host"></div>
    </div>
  </div>`);

  const stackRows = [
    ["Frontend", "React.js + CSS", "Component-based dashboard UI, fast to build"],
    ["Backend", "Node.js + Express", "Auth, orchestration, API routing"],
    ["Database", "MongoDB", "Flexible schema for inconsistent CPSE fields"],
    ["AI / NLP", "Python + FastAPI + SBERT", "Mature NLP ecosystem, sentence-level embeddings"],
    ["Similarity", "Cosine Similarity", "Simple, fast, well-understood meaning comparison"],
    ["Integration", "REST + CSV/JSON", "ERP-agnostic, works with a mocked SAP import/export"],
    ["Deployment", "Vercel + Render (free tier)", "Zero-cost hosting for a hackathon prototype"],
  ];
  const stackBody = wrap.querySelector("#stack-body");
  stackRows.forEach(([layer, tech, why]) => {
    stackBody.appendChild(el(`<tr><td>${layer}</td><td class="map-nmc">${tech}</td><td>${why}</td></tr>`));
  });

  const stdHost = wrap.querySelector("#standards-host");
  STANDARDS.forEach((s) => {
    stdHost.appendChild(el(`<div class="graph-legend-row"><b>${s.name}</b> — ${s.full}. ${s.note} <a href="${s.url}" target="_blank" rel="noopener" class="ext-link">↗ reference</a></div>`));
  });

  const glossHost = wrap.querySelector("#glossary-host");
  GLOSSARY.forEach((g) => {
    glossHost.appendChild(el(`<details class="tree-node"><summary class="tree-sub"><span>${g.term}</span></summary><div class="tree-children"><p class="gloss-def">${g.def}</p></div></details>`));
  });

  return wrap;
}

/* ============================================================
   CODE MAPPING
   ============================================================ */

function renderMapping() {
  const wrap = el(`<div>
    <div class="page-head"><h1>Code mapping</h1></div>
    <p class="page-note">Every National Material Code retains a live map back to each CPSE's original code — nothing is overwritten, only linked.</p>
    <div class="map-search"><input type="text" id="map-search" placeholder="Search by NMC, legacy code, or material name..."></div>
    <table class="map-table">
      <thead><tr><th style="width:180px">NMC</th><th>Material</th><th>Legacy codes</th><th style="width:90px">Status</th><th style="width:100px"></th></tr></thead>
      <tbody id="map-body"></tbody>
    </table>
  </div>`);

  const body = wrap.querySelector("#map-body");
  const searchInput = wrap.querySelector("#map-search");

  function draw(filter) {
    body.innerHTML = "";
    const f = (filter || "").toLowerCase();
    MATERIAL_GROUPS.forEach((g) => {
      const haystack = [g.nmc, g.name, ...g.records.map((r) => r.code)].join(" ").toLowerCase();
      if (f && !haystack.includes(f)) return;
      const isLive = g.status === "approved";
      const row = el(`<tr>
        <td class="map-nmc">${g.nmc}</td>
        <td>${g.name}</td>
        <td>${g.records.map((r) => `<div class="map-legacy-row"><span class="map-legacy-cpse">${r.cpse}</span> · ${r.code}</div>`).join("")}</td>
        <td><span class="status-pill ${isLive ? "live" : "pending"}">${isLive ? "Live" : "Pending"}</span></td>
        <td></td>
      </tr>`);
      if (isLive) {
        const syncBtn = el(`<button class="btn small">Sync →</button>`);
        syncBtn.addEventListener("click", () => openModal(buildErpSyncModal(g)));
        row.lastElementChild.appendChild(syncBtn);
      }
      body.appendChild(row);
    });
  }

  searchInput.addEventListener("input", () => draw(searchInput.value));
  draw("");

  return wrap;
}

/* ---------- boot ---------- */

render();
