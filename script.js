// ============================================================
// script.js — RoleFit AI Builder Logic
// ============================================================

let state = {
  step: 1,
  role: "",
  template: "classic",
  coverTone: "formal",
  skills: [],
  projects: [],
  fresherMode: false,
  atsScore: 0,
  matched: [],
  missing: []
};

// ---- NAVIGATION ----
function showPage(page) {
  document.getElementById("page-home").classList.toggle("hidden", page !== "home");
  document.getElementById("page-builder").classList.toggle("hidden", page !== "builder");
  document.getElementById("page-converter").classList.toggle("hidden", page !== "converter");
  window.scrollTo(0, 0);
  if (page === "builder") renderTemplates();
}

function goStep(n) {
  document.getElementById(`step-${state.step}`).classList.remove("active");
  document.querySelectorAll(".prog-step").forEach(s => {
    const sn = parseInt(s.dataset.step);
    s.classList.remove("active","done");
    if (sn < n) s.classList.add("done");
    if (sn === n) s.classList.add("active");
  });
  state.step = n;
  document.getElementById(`step-${n}`).classList.add("active");
  document.getElementById("current-step-num").innerText = n;
  if (n === 5) runAIAnalysis();
  if (n === 7) renderFinalResume();
  window.scrollTo(0, 0);
}

// ---- TAG INPUT (SKILLS) ----
let skills = [];
function handleTagInput(e, type) {
  if (e.key === "Enter" || e.key === ",") {
    e.preventDefault();
    const val = e.target.value.replace(",","").trim();
    if (val) addSkill(val);
    e.target.value = "";
  }
}
function addSkill(val) {
  if (!skills.includes(val)) {
    skills.push(val);
    renderSkillTags();
    updateSkillSuggestions();
  }
}
function removeSkill(s) {
  skills = skills.filter(x => x !== s);
  renderSkillTags();
  updateSkillSuggestions();
}
function renderSkillTags() {
  document.getElementById("skills-tags").innerHTML = skills.map(s =>
    `<span class="tag">${s}<span class="tag-remove" onclick="removeSkill('${s}')">×</span></span>`
  ).join("");
}
function updateSkillSuggestions() {
  const role = state.role;
  if (!role || !JOB_ROLES[role]) return;
  const suggestions = JOB_ROLES[role].skills.filter(s => !skills.includes(s)).slice(0, 6);
  document.getElementById("skill-suggestions").innerHTML = suggestions.map(s =>
    `<span class="sug-chip" onclick="addSkill('${s}')">${s}</span>`
  ).join("");
  document.getElementById("skill-suggest-bar").style.display = suggestions.length ? "flex" : "none";
}

// ---- ROLE SELECTION ----
function selectRole(role) {
  state.role = role;
  document.querySelectorAll(".role-pill").forEach(p => p.classList.remove("selected"));
  event.target.classList.add("selected");
  showToast(`✅ Role set: ${role}`);
  updateSkillSuggestions();
}

// ---- FRESHER MODE ----
function activateFresherMode() {
  const btn = document.getElementById("fresher-btn");
  state.fresherMode = !state.fresherMode;
  btn.classList.toggle("active", state.fresherMode);
  btn.innerText = state.fresherMode ? "✅ Fresher Mode Active — AI Projects Loaded!" : "🎓 I'm a Fresher — Generate AI Projects for Me";
  if (state.fresherMode) {
    const role = state.role || "Software Engineer";
    const roleData = JOB_ROLES[role] || JOB_ROLES["Software Engineer"];
    state.projects = roleData.projects.map((p, i) => ({ id: i, ...p }));
    renderProjects();
    showToast("🤖 AI generated 3 projects for you!");
  }
}

// ---- PROJECTS ----
let projectId = 0;
function addProject() {
  const id = ++projectId;
  state.projects.push({ id, title: "", desc: "" });
  renderProjects();
}
function removeProject(id) {
  state.projects = state.projects.filter(p => p.id !== id);
  renderProjects();
}
function renderProjects() {
  document.getElementById("projects-list").innerHTML = state.projects.map(p => `
    <div class="project-item" id="proj-${p.id}">
      <div class="project-item-header">
        <input type="text" value="${p.title}" placeholder="Project / Experience title" onchange="updateProject(${p.id},'title',this.value)"
          style="border:none;background:transparent;font-size:.9rem;font-weight:700;outline:none;width:80%;font-family:inherit">
        <button class="btn-remove-proj" onclick="removeProject(${p.id})">✕ Remove</button>
      </div>
      <textarea rows="2" placeholder="Describe it with impact (e.g. Built X using Y, achieving Z…)" onchange="updateProject(${p.id},'desc',this.value)"
        style="width:100%;border:none;background:transparent;font-size:.82rem;color:var(--muted);outline:none;resize:none;font-family:inherit;line-height:1.55">${p.desc}</textarea>
    </div>`).join("");
}
function updateProject(id, field, val) {
  const p = state.projects.find(x => x.id === id);
  if (p) p[field] = val;
}

// ---- AI ANALYSIS (Rule-based simulation) ----
function runAIAnalysis() {
  goStep(5);
  const role = state.role || "Software Engineer";
  const roleData = JOB_ROLES[role] || JOB_ROLES["Software Engineer"];
  const jd = document.getElementById("f-jd").value.toLowerCase();
  const allKeywords = [...roleData.keywords, ...(jd ? extractJDKeywords(jd) : [])];

  // Match user skills against role keywords
  const userSkillsLower = skills.map(s => s.toLowerCase());
  state.matched = allKeywords.filter(k => userSkillsLower.some(s => s.includes(k.toLowerCase()) || k.toLowerCase().includes(s)));
  state.missing = allKeywords.filter(k => !state.matched.includes(k)).slice(0, 8);

  // ATS Score: base 40 + matches
  const matchRatio = state.matched.length / Math.max(allKeywords.length, 1);
  const hasExp = document.getElementById("f-experience").value.length > 20;
  const hasCert = document.getElementById("f-certifications").value.length > 3;
  const hasProjects = state.projects.length > 0;
  state.atsScore = Math.min(97, Math.round(40 + matchRatio * 35 + (hasExp ? 8 : 0) + (hasCert ? 5 : 0) + (hasProjects ? 12 : 0)));

  animateATSScore(state.atsScore);
  renderMatchedSkills();
  renderMissingSkills();
  renderAITips();
}

function extractJDKeywords(jd) {
  const words = jd.match(/\b[A-Za-z]{3,}\b/g) || [];
  const stopWords = new Set(["the","and","for","with","our","you","are","has","have","will","your","that","this","from","they","their","been","into"]);
  return [...new Set(words.filter(w => !stopWords.has(w.toLowerCase()) && w.length > 3))].slice(0, 10);
}

function animateATSScore(target) {
  let current = 0;
  const el = document.getElementById("ats-score-display");
  const arc = document.getElementById("ats-arc");
  const timer = setInterval(() => {
    current = Math.min(current + 2, target);
    el.innerText = current;
    // Animate arc: full arc = 157, dashoffset at 0 = full fill
    const offset = 157 - (157 * current / 100);
    arc.style.strokeDashoffset = offset;
    arc.style.stroke = current >= 70 ? "#22c55e" : current >= 50 ? "#f97316" : "#ef4444";
    if (current >= target) clearInterval(timer);
  }, 25);

  const label = document.getElementById("ats-label");
  const desc = document.getElementById("ats-desc");
  if (target >= 75) {
    label.innerText = "Strong Resume ✅";
    label.style.color = "#16a34a";
    desc.innerText = "Your resume is well-optimized. Apply with confidence!";
  } else if (target >= 50) {
    label.innerText = "Needs Improvement ⚠️";
    label.style.color = "#f97316";
    desc.innerText = "Add more keywords from the job description to improve your score.";
  } else {
    label.innerText = "Weak Match ❌";
    label.style.color = "#ef4444";
    desc.innerText = "Your resume needs significant optimization for this role.";
  }
}

function renderMatchedSkills() {
  document.getElementById("matched-skills").innerHTML =
    state.matched.length ? state.matched.map(s => `<span class="chip-matched">✅ ${s}</span>`).join("") : "<span style='color:var(--muted);font-size:.85rem'>No matches yet. Add more skills.</span>";
}

function renderMissingSkills() {
  document.getElementById("missing-skills").innerHTML =
    state.missing.length ? state.missing.map(s => `<span class="chip-missing" style="cursor:pointer" onclick="addSkill('${s}');showToast('✅ ${s} added to your skills!')">${s} +</span>`).join("") : "<span style='color:var(--green);font-size:.85rem'>Great! No major keywords missing.</span>";
}

function renderAITips() {
  const tips = [];
  if (state.missing.length > 3) tips.push(`Add these missing keywords to your skills: ${state.missing.slice(0,3).join(", ")}.`);
  if (!document.getElementById("f-experience").value) tips.push("Add internship or work experience — even a 2-month stint significantly boosts your ATS score.");
  if (state.projects.length < 2) tips.push("Include at least 2–3 projects. Quantify outcomes (e.g. 'Reduced load time by 40%').");
  if (!document.getElementById("f-certifications").value) tips.push("Add certifications relevant to your role (e.g. AWS, Google Analytics, Meta Blueprint).");
  if (skills.length < 6) tips.push("List at least 8–10 skills relevant to your target role.");
  tips.push(`Use strong action verbs: ${ACTION_VERBS.slice(0,5).join(", ")}…`);
  tips.push("Keep your resume to 1 page if you have under 2 years of experience.");

  document.getElementById("ai-tips").innerHTML = tips.slice(0,5).map(t =>
    `<li>💡 ${t}</li>`
  ).join("");
}

function makeStronger() {
  const boost = Math.min(97, state.atsScore + Math.floor(Math.random() * 8 + 5));
  state.atsScore = boost;
  animateATSScore(boost);
  // Auto-add missing skills
  if (state.missing.length > 0) {
    const toAdd = state.missing.slice(0, 2);
    toAdd.forEach(s => { if (!skills.includes(s)) skills.push(s); });
    state.missing = state.missing.slice(2);
    renderSkillTags();
    renderMatchedSkills();
    renderMissingSkills();
  }
  showToast("🔥 Resume strengthened! Score improved.");
}

function rerunAnalysis() {
  animateATSScore(0);
  setTimeout(() => runAIAnalysis(), 300);
}

// ---- TEMPLATES ----
function renderTemplates() {
  const grid = document.getElementById("templates-grid");
  if (!grid) return;
  grid.innerHTML = RESUME_TEMPLATES.map(t => `
    <div class="template-card ${state.template === t.id ? 'selected' : ''}" onclick="selectTemplate('${t.id}')">
      <div class="template-preview">
        <div class="tpl-header"></div>
        <div class="tpl-line short" style="margin-top:4px"></div>
        <div class="tpl-section" style="margin-top:8px"></div>
        <div class="tpl-line long"></div>
        <div class="tpl-line med"></div>
        <div class="tpl-line full"></div>
        <div class="tpl-section" style="margin-top:8px"></div>
        <div class="tpl-line med"></div>
        <div class="tpl-line short"></div>
      </div>
      <div class="template-info">
        <div class="tpl-name">${t.name}</div>
        <span class="tpl-tag ${t.tag === 'Free' ? 'tag-free' : 'tag-premium'}">${t.tag}</span>
        ${t.tag === "Premium" ? '<span class="template-lock">🔒</span>' : ''}
      </div>
    </div>`).join("");
}

function selectTemplate(id) {
  const tpl = RESUME_TEMPLATES.find(t => t.id === id);
  if (tpl && tpl.tag === "Premium") {
    showToast("🔒 Premium template — unlock for ₹199");
    showPayment("pro");
    return;
  }
  state.template = id;
  renderTemplates();
  showToast(`✅ Template "${tpl.name}" selected!`);
}

// ---- RESUME RENDER ----
function renderFinalResume() {
  const name   = document.getElementById("f-name").value || "Your Name";
  const email  = document.getElementById("f-email").value || "email@example.com";
  const phone  = document.getElementById("f-phone").value || "+91 98765 43210";
  const loc    = document.getElementById("f-location").value || "India";
  const li     = document.getElementById("f-linkedin").value || "";
  const edu    = document.getElementById("f-education").value || "B.Tech — Your College (2024)";
  const cgpa   = document.getElementById("f-cgpa").value || "";
  const cert   = document.getElementById("f-certifications").value || "";
  const langs  = document.getElementById("f-languages").value || "";
  const exp    = document.getElementById("f-experience").value || "";
  const role   = state.role || "Software Engineer";
  const roleD  = JOB_ROLES[role] || JOB_ROLES["Software Engineer"];
  const summaryText = roleD.summary;

  const contactLine = [email, phone, loc, li].filter(Boolean).join(" · ");
  const displaySkills = skills.length ? skills : (roleD.skills || []);
  const displayProjects = state.projects.length ? state.projects : roleD.projects;

  const html = `<div class="resume-classic">
    <div class="rc-name">${name}</div>
    <div class="rc-contact">${contactLine}</div>
    <div class="rc-section-title">Professional Summary</div>
    <div style="font-size:.82rem;color:var(--text);line-height:1.6;margin-bottom:.25rem">${summaryText}</div>
    ${displaySkills.length ? `<div class="rc-section-title">Skills</div>
    <div class="rc-skills">${displaySkills.map(s => `<span class="rc-skill-tag">${s}</span>`).join("")}</div>` : ""}
    <div class="rc-section-title">Education</div>
    <div class="rc-item-title">${edu}</div>
    ${cgpa ? `<div class="rc-item-sub">${cgpa}</div>` : ""}
    ${displayProjects.length ? `<div class="rc-section-title">Projects</div>
    ${displayProjects.map(p => `<div style="margin-bottom:.6rem">
      <div class="rc-item-title">${p.title}</div>
      <div class="rc-bullet">${p.desc}</div>
    </div>`).join("")}` : ""}
    ${exp ? `<div class="rc-section-title">Experience</div>
    ${exp.split("\n").map(line => line.startsWith("•") ? `<div class="rc-bullet">${line.slice(1).trim()}</div>` : `<div class="rc-item-title" style="margin-bottom:.2rem">${line}</div>`).join("")}` : ""}
    ${cert ? `<div class="rc-section-title">Certifications</div><div class="rc-bullet">${cert}</div>` : ""}
    ${langs ? `<div class="rc-section-title">Languages</div><div style="font-size:.8rem">${langs}</div>` : ""}
  </div>`;

  document.getElementById("resume-preview-area").innerHTML = html;
}

// ---- DOWNLOAD ----
function downloadResume() {
  renderFinalResume();
  showToast("🖨️ Opening print dialog — Save as PDF to download!");
  setTimeout(() => window.print(), 500);
}

// ---- COVER LETTER ----
function setCoverTone(tone, btn) {
  state.coverTone = tone;
  document.querySelectorAll(".tone-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
}

function generateCoverLetter() {
  const data = {
    name: document.getElementById("f-name").value || "Your Name",
    role: state.role || "Software Engineer",
    company: document.getElementById("f-company").value,
    education: document.getElementById("f-education").value,
    skills,
    projects: state.projects,
    field: state.role
  };
  const fn = COVER_LETTER_TEMPLATES[state.coverTone] || COVER_LETTER_TEMPLATES.formal;
  const text = fn(data);
  document.getElementById("cover-letter-text").innerText = text;
  document.getElementById("cover-letter-card").classList.remove("hidden");
  showToast("✉️ Cover letter generated!");
}

function regenerateCoverLetter() {
  state.coverTone = state.coverTone === "formal" ? "confident" : "formal";
  document.querySelectorAll(".tone-btn").forEach(b => {
    b.classList.toggle("active", b.innerText.toLowerCase() === state.coverTone);
  });
  generateCoverLetter();
}

function printCoverLetter() {
  const text = document.getElementById("cover-letter-text").innerText;
  const win = window.open("","_blank");
  win.document.write(`<html><head><title>Cover Letter</title><style>body{font-family:Inter,sans-serif;padding:3rem;max-width:720px;margin:0 auto;font-size:14px;line-height:1.8;color:#1e293b}pre{white-space:pre-wrap;font-family:inherit}</style></head><body><pre>${text}</pre></body></html>`);
  win.document.close();
  win.print();
}

// ---- PAYMENT ----
function showPayment(plan) {
  const amounts = { pro: "₹199", unlimited: "₹299" };
  document.getElementById("payment-amount").innerText = amounts[plan] || "₹199";
  document.getElementById("modal-payment").classList.remove("hidden");
}

function simulatePayment() {
  document.getElementById("modal-payment").classList.add("hidden");
  showToast("✅ Payment successful! Premium features unlocked.");
  // Unlock all templates
  RESUME_TEMPLATES.forEach(t => t.tag = "Free");
  renderTemplates();
}

// ---- TOAST ----
const $toast = document.getElementById("toast");
function showToast(msg) {
  $toast.innerText = msg;
  $toast.classList.remove("hidden");
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => $toast.classList.add("hidden"), 2800);
}

// ---- CV CONVERTER LOGIC ----
let convTone = "professional";

function setConvTone(tone, btn) {
  convTone = tone;
  document.querySelectorAll("#page-converter .tone-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
}

async function convertCV() {
  const cvText = document.getElementById("conv-cv-input").value.trim();
  const jdText = document.getElementById("conv-jd-input").value.trim();
  const apiKey = document.getElementById("conv-api-key").value.trim();

  if (!cvText || !jdText) {
    showToast("⚠️ Please provide both your CV and a Job Description.");
    return;
  }

  showToast(apiKey ? "🚀 Connecting to AI... this may take 5-10s" : "🤖 Running local AI simulation...");
  document.getElementById("btn-convert").innerText = "⏳ AI is processing...";
  document.getElementById("btn-convert").disabled = true;

  if (apiKey) {
    try {
      const response = await callGeminiAPI(apiKey, cvText, jdText);
      renderAIResult(response, cvText);
    } catch (err) {
      console.error(err);
      showToast("❌ AI Error: " + err.message);
      document.getElementById("btn-convert").innerText = "✨ Convert CV to Match This Job";
      document.getElementById("btn-convert").disabled = false;
    }
  } else {
    // Fallback to local simulation
    setTimeout(() => {
      const role = document.getElementById("conv-role-select").value || "Software Engineer";
      const roleData = JOB_ROLES[role] || JOB_ROLES["Software Engineer"];
      const jdKeywords = extractJDKeywords(jdText);
      const matched = jdKeywords.filter(k => cvText.toLowerCase().includes(k.toLowerCase()));
      const missing = jdKeywords.filter(k => !matched.includes(k)).slice(0, 5);

      let tailoredCV = cvText;
      if (tailoredCV.toLowerCase().includes("skills")) {
        const skillsRegex = /(skills\s*[:\-\n])([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i;
        tailoredCV = tailoredCV.replace(skillsRegex, (match, p1, p2) => {
          return `${p1}${p2.trim()}, ${missing.join(", ")}`;
        });
      }
      const summaryRegex = /(summary|objective|profile\s*[:\-\n])([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i;
      if (tailoredCV.match(summaryRegex)) {
        tailoredCV = tailoredCV.replace(summaryRegex, (match, p1) => {
          return `${p1}${roleData.summary}`;
        });
      } else {
        tailoredCV = `SUMMARY\n${roleData.summary}\n\n${tailoredCV}`;
      }
      ACTION_VERBS.slice(0, 3).forEach((verb, i) => {
        tailoredCV = tailoredCV.replace(/•\s+/g, (match, offset) => {
          return offset % 2 === 0 ? `• ${verb} ` : match;
        });
      });

      const simulatedResult = {
        tailoredText: tailoredCV,
        keywordsAdded: missing,
        scoreBefore: Math.round(40 + (matched.length / Math.max(jdKeywords.length, 1)) * 30),
        scoreAfter: 88,
        improvements: 4
      };
      renderAIResult(simulatedResult, cvText);
    }, 2000);
  }
}

async function callGeminiAPI(key, cv, jd) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
  const prompt = `You are a professional Resume Optimizer.
Target Job Description:
${jd}

User's Current CV:
${cv}

TASK:
1. Tailor the CV to perfectly match the Job Description.
2. Optimize for ATS keywords found in the JD.
3. Enhance bullet points using strong action verbs and quantifiable metrics.
4. Keep the output professional and concise.

RETURN ONLY A JSON OBJECT with this structure:
{
  "tailoredText": "full plain text of the new resume",
  "keywordsAdded": ["list", "of", "keywords", "you", "injected"],
  "scoreBefore": 45,
  "scoreAfter": 92,
  "improvements": 5,
  "formattedHTML": "a clean HTML version for professional printing. Use <h1> for name, <div class='contact-info'> for contact info, <h2> for section headers, <p> for paragraphs, and <ul><li> for bullets. Avoid any style tags, use the classes provided."
}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    })
  });

  if (!res.ok) throw new Error(await res.text());
  const json = await res.json();
  return JSON.parse(json.candidates[0].content.parts[0].text);
}

function renderAIResult(result, originalCV) {
  document.getElementById("conv-before-text").innerText = originalCV;
  document.getElementById("conv-after-text").innerText = result.tailoredText;
  document.getElementById("conv-keywords-added").innerText = result.keywordsAdded.length;
  document.getElementById("conv-score-before").innerText = result.scoreBefore;
  document.getElementById("conv-score-after").innerText = result.scoreAfter;
  document.getElementById("conv-improvements").innerText = result.improvements;

  document.getElementById("conv-keyword-chips").innerHTML = result.keywordsAdded.map(k => `<span class="chip-matched">✅ ${k}</span>`).join("");

  // Professional Template Render
  if (result.formattedHTML) {
    document.getElementById("pro-resume-content").innerHTML = result.formattedHTML;
  } else {
    // Basic fallback if AI didn't provide HTML
    document.getElementById("pro-resume-content").innerHTML = `<h1>CV</h1><pre>${result.tailoredText}</pre>`;
  }

  document.getElementById("conv-output-section").classList.remove("hidden");
  document.getElementById("btn-convert").innerText = "✨ Convert CV to Match This Job";
  document.getElementById("btn-convert").disabled = false;

  showToast("✅ CV successfully tailored by AI!");
  document.getElementById("conv-output-section").scrollIntoView({ behavior: 'smooth' });
}

function downloadConvertedCV() {
  showToast("🖨️ Opening print dialog. Please choose 'Save as PDF'.");
  window.print();
}

function copyConvertedCV() {
  const text = document.getElementById("conv-after-text").innerText;
  navigator.clipboard.writeText(text).then(() => {
    showToast("📋 Tailored CV copied to clipboard!");
  });
}

function reconvert() {
  document.getElementById("conv-output-section").classList.add("hidden");
  document.getElementById("conv-jd-input").value = "";
  window.scrollTo(0, 0);
  showToast("🔄 Ready for a new job description.");
}

// ---- INIT ----
document.getElementById("skill-suggest-bar").style.display = "none";
goStep(1); // ensure step 1 is shown on builder load
