// Data Models
let state = {
  lowMode: false,
  tasks: [],
  thoughts: [],
  decisions: [],
  history: [],
  today: { date: new Date().toLocaleDateString(), mood: 3, energy: 3, stress: 3 }
};

// --- Storage ---
function loadData() {
  const saved = localStorage.getItem('life-dash-vanilla');
  if (saved) {
    const parsed = JSON.parse(saved);
    state = { ...state, ...parsed };
  }
  
  // Handle daily rollover
  const todayDate = new Date().toLocaleDateString();
  if (state.today.date !== todayDate) {
    if (!state.history.find(h => h.date === state.today.date)) {
      state.history.push({ ...state.today });
    }
    state.today = { date: todayDate, mood: 3, energy: 3, stress: 3 };
    saveData();
  }
}

function saveData() {
  localStorage.setItem('life-dash-vanilla', JSON.stringify(state));
  renderAll();
}

// --- DOM Elements ---
const els = {
  body: document.body,
  lowModeBtn: document.getElementById('toggle-low-mode'),
  lowModeText: document.getElementById('low-mode-text'),
  lowModeIcon: document.getElementById('low-mode-icon'),
  
  // Daily State
  moodIn: document.getElementById('input-mood'),
  energyIn: document.getElementById('input-energy'),
  stressIn: document.getElementById('input-stress'),
  moodVal: document.getElementById('val-mood'),
  energyVal: document.getElementById('val-energy'),
  stressVal: document.getElementById('val-stress'),

  // Tasks
  taskForm: document.getElementById('task-form'),
  taskInput: document.getElementById('task-input'),
  taskEnergy: document.getElementById('task-energy'),
  taskImp: document.getElementById('task-importance'),
  taskList: document.getElementById('task-list'),
  suggestedContainer: document.getElementById('suggested-task-container'),
  suggestedTitle: document.getElementById('suggested-task-title'),
  btnCompSuggested: document.getElementById('btn-complete-suggested'),
  dashboardContent: document.getElementById('dashboard-content'),

  // Thoughts
  thoughtInput: document.getElementById('thought-input'),
  btnSaveThought: document.getElementById('btn-save-thought'),
  thoughtList: document.getElementById('thought-list'),

  // Decisions
  decisionForm: document.getElementById('decision-form'),
  decInput: document.getElementById('decision-input'),
  decImpIn: document.getElementById('input-dec-imp'),
  decEffIn: document.getElementById('input-dec-eff'),
  decImpctIn: document.getElementById('input-dec-impct'),
  decImpVal: document.getElementById('val-dec-imp'),
  decEffVal: document.getElementById('val-dec-eff'),
  decImpctVal: document.getElementById('val-dec-impct'),
  decListContainer: document.getElementById('decision-list-container'),
  decList: document.getElementById('decision-list'),
  btnClearDec: document.getElementById('btn-clear-decisions'),

  // Insights
  statMood: document.getElementById('stat-avg-mood'),
  statEnergy: document.getElementById('stat-avg-energy'),
  insightMsg: document.getElementById('insight-message')
};

// --- Helpers ---
const getLabel = (val) => val <= 2 ? "Low" : val == 3 ? "Medium" : "High";

// --- Render Logic ---
function renderAll() {
  renderLowMode();
  renderDailyState();
  renderTasks();
  renderThoughts();
  renderDecisions();
  renderInsights();
}

function renderLowMode() {
  els.body.classList.toggle('low-mode', state.lowMode);
  els.lowModeText.innerText = state.lowMode ? "Normal Mode" : "Low Mode";
  els.lowModeIcon.innerText = state.lowMode ? "☀️" : "🌙";
  
  let lowTaskBox = document.getElementById('section-low-mode-task');
  if (state.lowMode) {
    if (!lowTaskBox) {
      lowTaskBox = document.createElement('div');
      lowTaskBox.id = 'section-low-mode-task';
      lowTaskBox.innerHTML = `<h2>⚡ Suggested Task for Now</h2><div id="lm-task-content"></div>`;
      els.dashboardContent.appendChild(lowTaskBox);
    }
    
    const content = document.getElementById('lm-task-content');
    const task = getSuggestedTask();
    if (task) {
      content.innerHTML = `<div class="low-mode-task-box">
        <p class="low-mode-title">${task.title}</p>
        <button class="btn btn-primary full-width" onclick="completeTask(${task.id})">✅ Mark as Done</button>
      </div>`;
    } else {
      content.innerHTML = `<p style="margin-top:1rem; color:var(--primary); font-weight:500;">No pending tasks. Enjoy your rest! ☕</p>`;
    }
  } else {
    if (lowTaskBox) lowTaskBox.remove();
  }
}

function renderDailyState() {
  els.moodIn.value = state.today.mood;
  els.energyIn.value = state.today.energy;
  els.stressIn.value = state.today.stress;
  
  els.moodVal.innerText = `${getLabel(state.today.mood)} (${state.today.mood}/5)`;
  els.energyVal.innerText = `${getLabel(state.today.energy)} (${state.today.energy}/5)`;
  els.stressVal.innerText = `${getLabel(state.today.stress)} (${state.today.stress}/5)`;
}

function getSuggestedTask() {
  const pending = state.tasks.filter(t => !t.done);
  if (pending.length === 0) return null;
  
  const currentEnergy = getLabel(state.today.energy).toLowerCase();
  const mapEnergy = (val) => val <= 2 ? 'low' : val == 3 ? 'medium' : 'high';
  const cEnergy = mapEnergy(state.today.energy);

  return pending.sort((a, b) => {
    const eA = a.energyReq === cEnergy ? 1 : 0;
    const eB = b.energyReq === cEnergy ? 1 : 0;
    const iA = a.importance === 'high' ? 1 : 0;
    const iB = b.importance === 'high' ? 1 : 0;
    return (eB + iB) - (eA + iA);
  })[0];
}

function renderTasks() {
  els.taskList.innerHTML = '';
  if (state.tasks.length === 0) {
    els.taskList.innerHTML = '<p style="text-align:center; color:var(--text-muted); font-size:0.875rem; margin-top:1rem;">No tasks yet. Add one above!</p>';
  } else {
    state.tasks.forEach(t => {
      const div = document.createElement('div');
      div.className = 'task-item';
      
      const tagClass = t.energyReq === 'high' ? 'tag-high' : t.energyReq === 'low' ? 'tag-low' : 'tag-med';

      div.innerHTML = `
        <div class="task-left">
          <button class="icon-btn" onclick="toggleTask(${t.id})">${t.done ? '✅' : '⭕'}</button>
          <span class="task-title ${t.done ? 'task-done' : ''}">${t.title}</span>
        </div>
        <div class="task-right">
          ${!t.done ? `<span class="task-tag ${tagClass}">${t.energyReq} energy</span>` : ''}
          <button class="btn-delete" onclick="deleteTask(${t.id})">Delete</button>
        </div>
      `;
      els.taskList.appendChild(div);
    });
  }

  const suggested = getSuggestedTask();
  if (suggested && !state.lowMode) {
    els.suggestedContainer.classList.remove('hidden');
    els.suggestedTitle.innerText = suggested.title;
    els.btnCompSuggested.onclick = () => completeTask(suggested.id);
  } else {
    els.suggestedContainer.classList.add('hidden');
  }
}

function renderThoughts() {
  els.thoughtList.innerHTML = '';
  if (state.thoughts.length === 0) {
    els.thoughtList.innerHTML = '<p style="text-align:center; color:var(--text-muted); font-size:0.875rem; margin-top:1rem;">Mind is clear! No thoughts dumped yet.</p>';
  } else {
    state.thoughts.forEach(t => {
      const div = document.createElement('div');
      div.className = 'thought-item';
      
      const catClass = t.category === 'Actionable' ? 'cat-action' : t.category === 'Ignore' ? 'cat-ignore' : 'cat-revisit';

      div.innerHTML = `
        <p class="thought-text">${t.text}</p>
        <div class="thought-meta">
          <span class="thought-cat ${catClass}">${t.category}</span>
          <span class="thought-time">${t.time}</span>
        </div>
        <button class="btn-delete-thought" onclick="deleteThought(${t.id})">✕</button>
      `;
      els.thoughtList.appendChild(div);
    });
  }
}

function renderDecisions() {
  els.decList.innerHTML = '';
  if (state.decisions.length === 0) {
    els.decListContainer.classList.add('hidden');
  } else {
    els.decListContainer.classList.remove('hidden');
    state.decisions.forEach((d, i) => {
      const div = document.createElement('div');
      div.className = `decision-item ${i === 0 ? 'top-choice' : ''}`;
      div.innerHTML = `
        <span class="task-title" style="margin-left: ${i===0?'0.5rem':'0'}">${d.option}</span>
        <span class="decision-score">${d.score} pts</span>
      `;
      els.decList.appendChild(div);
    });
  }
}

function renderInsights() {
  const recent = state.history.slice(-7);
  if (recent.length === 0) {
    els.statMood.innerText = "-";
    els.statEnergy.innerText = "-";
    els.insightMsg.innerText = "Log your state for a few days to see insights!";
    return;
  }
  
  const avgMood = (recent.reduce((acc, curr) => acc + curr.mood, 0) / recent.length).toFixed(1);
  const avgEnergy = (recent.reduce((acc, curr) => acc + curr.energy, 0) / recent.length).toFixed(1);

  els.statMood.innerText = avgMood;
  els.statEnergy.innerText = avgEnergy;

  let insight = "Keep tracking to learn your patterns.";
  if (avgMood > 3.5 && avgEnergy > 3.5) insight = "You've been in a great state lately! Keep doing what you're doing.";
  else if (avgEnergy < 2.5) insight = "Your energy has been consistently low. Try to schedule more rest.";
  else if (avgMood < 2.5) insight = "It's been a tough week emotionally. Be kind to yourself.";

  els.insightMsg.innerText = `💡 ${insight}`;
}

// --- Event Listeners ---

// Low Mode
els.lowModeBtn.addEventListener('click', () => {
  state.lowMode = !state.lowMode;
  saveData();
});

// Daily State
[els.moodIn, els.energyIn, els.stressIn].forEach(el => {
  el.addEventListener('input', (e) => {
    const field = e.target.id.replace('input-', '');
    state.today[field] = parseInt(e.target.value);
    saveData();
  });
});

// Tasks
els.taskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const title = els.taskInput.value.trim();
  if (!title) return;
  
  state.tasks.unshift({
    id: Date.now(),
    title,
    energyReq: els.taskEnergy.value,
    importance: els.taskImp.value,
    done: false
  });
  
  els.taskInput.value = '';
  saveData();
});

window.toggleTask = (id) => {
  const t = state.tasks.find(x => x.id === id);
  if (t) { t.done = !t.done; saveData(); }
};

window.completeTask = (id) => {
  const t = state.tasks.find(x => x.id === id);
  if (t) { t.done = true; saveData(); }
}

window.deleteTask = (id) => {
  state.tasks = state.tasks.filter(t => t.id !== id);
  saveData();
};

// Thoughts
const categorize = (content) => {
  const lower = content.toLowerCase();
  if (/(todo|must|need to|should|fix|call|email|buy)/.test(lower)) return 'Actionable';
  if (/(ignore|whatever|doesn't matter|stupid|annoyed)/.test(lower)) return 'Ignore';
  return 'Revisit Later';
};

els.btnSaveThought.addEventListener('click', () => {
  const text = els.thoughtInput.value.trim();
  if (!text) return;
  
  state.thoughts.unshift({
    id: Date.now(),
    text,
    category: categorize(text),
    time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
  });
  
  els.thoughtInput.value = '';
  saveData();
});

window.deleteThought = (id) => {
  state.thoughts = state.thoughts.filter(t => t.id !== id);
  saveData();
};

// Decisions
const updateDecVals = () => {
  els.decImpVal.innerText = `${els.decImpIn.value}/5`;
  els.decEffVal.innerText = `${els.decEffIn.value}/5`;
  els.decImpctVal.innerText = `${els.decImpctIn.value}/5`;
};
[els.decImpIn, els.decEffIn, els.decImpctIn].forEach(el => el.addEventListener('input', updateDecVals));

els.decisionForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const option = els.decInput.value.trim();
  if (!option) return;

  const imp = parseInt(els.decImpIn.value);
  const eff = parseInt(els.decEffIn.value);
  const impct = parseInt(els.decImpctIn.value);
  
  const invertedEffort = 6 - eff; 
  const score = Math.round((imp * impct * invertedEffort) / 1.25); 

  state.decisions.push({ id: Date.now(), option, score });
  state.decisions.sort((a, b) => b.score - a.score);
  
  els.decInput.value = '';
  els.decImpIn.value = 3; els.decEffIn.value = 3; els.decImpctIn.value = 3;
  updateDecVals();
  saveData();
});

els.btnClearDec.addEventListener('click', () => {
  state.decisions = [];
  saveData();
});

// Init
loadData();
renderAll();
