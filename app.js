// --- API URL ---
const apiUrl = "https://script.google.com/macros/s/AKfycbwiDlSFZIVr5m9B98GXuXpXOEd43Cn4tY4Ug6MNWGB4ebMHTJDPxlVmda9ModBrNT06/exec";
const SHEETS_API = apiUrl;

// --- App State ---
const appState = {
  plans: [],
  planExercises: [],
  userHistory: [],
  equipment: [],
  users: [],
  progressions: [],
  baseTest: [],
  currentUser: null
};

// --- API Functions ---
async function fetchSheet(sheetName) {
  try {
    const res = await fetch(`${SHEETS_API}?sheet=${sheetName}`);
    return await res.json();
  } catch {
    return [];
  }
}

async function postToSheet(sheetName, data) {
  try {
    await fetch(`${apiUrl}?sheet=${sheetName}`, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(data)
    });
    return true;
  } catch {
    return false;
  }
}

async function loadAllTables() {
  [appState.plans, appState.planExercises, appState.userHistory, appState.equipment, appState.users, appState.progressions, appState.baseTest] = await Promise.all([
    fetchSheet('TrainingPlans'),
    fetchSheet('TrainingPlanExercises'),
    fetchSheet('UserHistory'),
    fetchSheet('Equipment'),
    fetchSheet('Users'),
    fetchSheet('Progressions'),
    fetchSheet('BaseTest')
  ]);
}

// --- Base Test Logic ---
function needsBaseTest() {
  if (!appState.baseTest.length) return true;
  
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
  
  const latestTest = appState.baseTest
    .filter(test => test.UserId === getCurrentUserId())
    .sort((a, b) => new Date(b.Date) - new Date(a.Date))[0];
  
  return !latestTest || new Date(latestTest.Date) < twoMonthsAgo;
}

function getCurrentUserId() {
  // Pre jednoduchosť použijeme statické ID, neskôr možno rozšíriť
  return "user1";
}

// --- Progression Calculations ---
function getProgressionForExercise(exerciseName) {
  return appState.progressions.find(p => p.Exercise === exerciseName);
}

function calculateExpectedReps(baseReps, level) {
  // Jednoduchý progresný algoritmus: každý level +20%
  return Math.round(baseReps * Math.pow(1.2, level - 1));
}

function getExpectedRepsForExercise(exerciseName) {
  const baseTest = appState.baseTest
    .filter(test => test.UserId === getCurrentUserId() && test.Exercise === exerciseName)
    .sort((a, b) => new Date(b.Date) - new Date(a.Date))[0];
  
  if (!baseTest) return null;
  
  const progression = getProgressionForExercise(exerciseName);
  if (!progression) return parseInt(baseTest.Reps);
  
  return calculateExpectedReps(parseInt(baseTest.Reps), parseInt(progression.CurrentLevel));
}

// --- Base Test Form ---
function renderBaseTestForm() {
  const main = document.querySelector('main');
  main.innerHTML = `
    <section id="section-basetest">
      <h1>🏃 Base Test Required</h1>
      <p>You need to complete a base test to establish your starting levels. This test should be done every 2 months or when starting.</p>
      <div id="basetest-form">
        <!-- Base test exercises will be loaded here -->
      </div>
      <button onclick="submitBaseTest()" id="submit-basetest">
        <svg width="18" height="18" fill="#fff" style="vertical-align:middle; margin-right:4px;" viewBox="0 0 16 16">
          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
          <path d="m10.97 4.97-.02.022-3.473 4.425-2.093-2.094a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
        </svg>
        Complete Base Test
      </button>
      <div id="basetest-status"></div>
    </section>
  `;
  
  loadBaseTestExercises();
}

function loadBaseTestExercises() {
  const form = document.getElementById('basetest-form');
  
  // Základné cviky pre base test
  const baseExercises = [
    'Push-ups', 'Pull-ups', 'Squats', 'Plank', 'Sit-ups', 'Burpees'
  ];
  
  form.innerHTML = baseExercises.map(exercise => `
    <div class="exercise" style="margin-bottom: 1rem;">
      <label for="base-${exercise}" style="flex: 1; font-weight: bold;">${exercise}:</label>
      <input type="number" id="base-${exercise}" min="0" placeholder="Max reps" style="flex: 0 0 120px;">
      <span style="flex: 0 0 60px; font-size: 0.9em; color: #888;">reps</span>
    </div>
  `).join('');
}

async function submitBaseTest() {
  const baseExercises = ['Push-ups', 'Pull-ups', 'Squats', 'Plank', 'Sit-ups', 'Burpees'];
  const today = new Date().toISOString().split("T")[0];
  const userId = getCurrentUserId();
  let errors = 0;

  for (const exercise of baseExercises) {
    const reps = document.getElementById(`base-${exercise}`).value;
    if (!reps || reps === "0") continue;

    const data = {
      UserId: userId,
      Date: today,
      Exercise: exercise,
      Reps: reps
    };

    const success = await postToSheet('BaseTest', data);
    if (!success) errors++;
  }

  const status = document.getElementById('basetest-status');
  if (errors === 0) {
    status.innerHTML = "✅ Base test completed! Loading workout...";
    status.style.color = "#28a745";
    
    // Reload data and show main app
    setTimeout(async () => {
      await loadAllTables();
      initializeApp();
    }, 1500);
  } else {
    status.innerHTML = "⚠️ Error saving some results. Please try again.";
    status.style.color = "#dc3545";
  }
}

// --- Equipment Section ---
function renderEquipment() {
  const equipmentList = document.getElementById('equipment-list');
  const equipment = appState.equipment;
  if (!equipment.length) {
    equipmentList.innerHTML = '<div style="color:#888">No equipment found.</div>';
    return;
  }
  equipmentList.innerHTML = equipment.map(eq =>
    `<div style="margin-bottom:0.7rem;display:flex;align-items:center;gap:0.7rem;">
      <svg width="20" height="20" fill="#58a6ff" viewBox="0 0 16 16"><path d="M6.5 1a1.5 1.5 0 0 0-1.415 1H2.5A1.5 1.5 0 0 0 1 3.5v9A1.5 1.5 0 0 0 2.5 14h11A1.5 1.5 0 0 0 15 12.5v-9A1.5 1.5 0 0 0 13.5 2h-2.585A1.5 1.5 0 0 0 9.5 1h-3zM2.5 3h11A.5.5 0 0 1 14 3.5v9a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-9A.5.5 0 0 1 2.5 3z"/></svg>
      <span><b>${eq.Name}</b> <span style="color:#aaa;font-size:0.95em;">${eq.Description||''}</span></span>
    </div>`
  ).join('');
}

// --- History Section ---
function renderHistory() {
  const historyLog = document.getElementById('history-log');
  const userHistory = appState.userHistory.filter(h => h.UserId === getCurrentUserId());
  
  if (!userHistory.length) {
    historyLog.innerHTML = '<div style="color:#888">No workout history found.</div>';
    return;
  }
  
  // Group by plan and day
  const thisWeekStart = getMondayDate(new Date());
  const weekData = userHistory.filter(row => new Date(row.Date) >= thisWeekStart);
  const recentByPlanDay = {};
  
  for (const entry of weekData) {
    const key = `${entry.PlanId || ''}||${entry.Day}`;
    if (!recentByPlanDay[key]) recentByPlanDay[key] = [];
    recentByPlanDay[key].push(`${entry.Exercise}: ${entry.Reps}`);
  }
  
  historyLog.innerHTML = "";
  
  // Show grouped by plan and day
  appState.plans.forEach(plan => {
    const days = getPlanDays(plan.Id);
    days.forEach(day => {
      const key = `${plan.Id}||${day}`;
      if (recentByPlanDay[key]) {
        const block = document.createElement("div");
        block.className = "history-entry";
        block.innerHTML = `<strong>${plan.Name} – ${day}</strong><br>${recentByPlanDay[key].join("<br>")}`;
        historyLog.appendChild(block);
      }
    });
  });
}

// --- Progressions Section ---
function renderProgressions() {
  const main = document.querySelector('main');
  main.innerHTML = `
    <section id="section-progressions">
      <h1>📈 Your Progressions</h1>
      <div id="progressions-list"></div>
      <button onclick="showSection('workout')" style="margin-top: 1rem;">
        ← Back to Workout
      </button>
    </section>
  `;
  
  const progressionsList = document.getElementById('progressions-list');
  const userProgressions = appState.progressions.filter(p => p.UserId === getCurrentUserId());
  
  if (!userProgressions.length) {
    progressionsList.innerHTML = '<div style="color:#888">No progressions tracked yet.</div>';
    return;
  }
  
  progressionsList.innerHTML = userProgressions.map(prog => {
    const baseTest = appState.baseTest
      .filter(test => test.UserId === getCurrentUserId() && test.Exercise === prog.Exercise)
      .sort((a, b) => new Date(b.Date) - new Date(a.Date))[0];
    
    const baseReps = baseTest ? parseInt(baseTest.Reps) : 0;
    const currentExpected = calculateExpectedReps(baseReps, parseInt(prog.CurrentLevel));
    const nextExpected = calculateExpectedReps(baseReps, parseInt(prog.CurrentLevel) + 1);
    
    return `
      <div class="progression-card" style="background: #21262d; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
        <h3 style="margin: 0 0 0.5rem 0; color: #58a6ff;">${prog.Exercise}</h3>
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
          <span>Current Level:</span>
          <strong style="color: #28a745;">Level ${prog.CurrentLevel}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
          <span>Base Test:</span>
          <span>${baseReps} reps</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
          <span>Current Target:</span>
          <strong>${currentExpected} reps</strong>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>Next Level Target:</span>
          <span style="color: #ffa500;">${nextExpected} reps</span>
        </div>
        <div style="margin-top: 0.5rem;">
          <button onclick="updateProgression('${prog.Exercise}', ${parseInt(prog.CurrentLevel) + 1})" 
                  style="background: #238636; color: white; border: none; padding: 0.3rem 0.8rem; border-radius: 4px; cursor: pointer;">
            Level Up!
          </button>
        </div>
      </div>
    `;
  }).join('');
}

async function updateProgression(exercise, newLevel) {
  const data = {
    UserId: getCurrentUserId(),
    Exercise: exercise,
    CurrentLevel: newLevel,
    DateAchieved: new Date().toISOString().split("T")[0]
  };
  
  const success = await postToSheet('Progressions', data);
  if (success) {
    await loadAllTables();
    renderProgressions();
  }
}

// --- Workout Section ---
function getPlanDays(planId) {
  return [...new Set(appState.planExercises.filter(e => e.PlanId === planId).map(e => e.Day))];
}

function getExercisesForDay(planId, day) {
  return appState.planExercises.filter(e => e.PlanId === planId && e.Day === day);
}

function renderWorkoutSection() {
  const planSelect = document.getElementById("plan-select");
  const daySelect = document.getElementById("day-select");
  
  if (!planSelect || !daySelect) return;
  
  // Render plan select
  planSelect.innerHTML = "";
  appState.plans.forEach(plan => {
    const opt = document.createElement("option");
    opt.value = plan.Id;
    opt.textContent = plan.Name;
    planSelect.appendChild(opt);
  });
  
  // Select first plan by default
  const selectedPlanId = planSelect.value || (appState.plans[0] && appState.plans[0].Id);
  renderDaySelect(selectedPlanId);
  planSelect.onchange = () => renderDaySelect(planSelect.value);
}

function renderDaySelect(planId) {
  const daySelect = document.getElementById("day-select");
  if (!daySelect) return;
  
  daySelect.innerHTML = "";
  const days = getPlanDays(planId);
  days.forEach(d => {
    const opt = document.createElement("option");
    opt.value = d;
    opt.textContent = d;
    daySelect.appendChild(opt);
  });
  
  // Select first day by default
  const selectedDay = daySelect.value || days[0];
  renderExercisesForDay(planId, selectedDay);
  daySelect.onchange = () => renderExercisesForDay(daySelect.parentElement.querySelector('#plan-select').value, daySelect.value);
}

function renderExercisesForDay(planId, day) {
  const exerciseList = document.getElementById("exercise-list");
  if (!exerciseList) return;
  
  const exercises = getExercisesForDay(planId, day);
  exerciseList.innerHTML = "";
  
  exercises.forEach(ex => {
    const isTimer = ex.Exercise.includes("(");
    const name = ex.Exercise.replace(/\s*\(.*?\)/, "");
    const wrapper = document.createElement("div");
    wrapper.className = "exercise";

    const label = document.createElement("label");
    label.textContent = ex.Exercise;

    const input = document.createElement("input");
    input.id = `rep-${name}`;
    input.type = "number";
    input.min = 0;
    input.placeholder = isTimer ? "seconds" : "reps";

    // Pre-fill with expected reps based on progressions
    const expectedReps = getExpectedRepsForExercise(name);
    if (expectedReps) {
      input.value = expectedReps;
      input.style.backgroundColor = "#0f3460"; // Highlight pre-filled values
    }

    wrapper.appendChild(label);
    wrapper.appendChild(input);

    // Add timer button if timed
    if (isTimer) {
      const timeInSec = parseInt(ex.Exercise.match(/\((\d+)s\)/)?.[1] || "0");
      const timerBtn = document.createElement("button");
      timerBtn.textContent = `▶️ ${timeInSec}s`;
      timerBtn.className = "timer-btn";
      timerBtn.onclick = () => startTimer(timerBtn, timeInSec);
      wrapper.appendChild(timerBtn);
    }

    exerciseList.appendChild(wrapper);
  });
}

function startTimer(btn, seconds) {
  let remaining = seconds;
  const originalText = btn.textContent;
  btn.disabled = true;
  const interval = setInterval(() => {
    if (remaining > 0) {
      btn.textContent = `⏳ ${remaining--}s`;
    } else {
      clearInterval(interval);
      btn.textContent = "✅ Done";
      setTimeout(() => {
        btn.textContent = originalText;
        btn.disabled = false;
      }, 1500);
    }
  }, 1000);
}

async function submitWorkout() {
  const planSelect = document.getElementById("plan-select");
  const daySelect = document.getElementById("day-select");
  const status = document.getElementById("status");
  
  if (!planSelect || !daySelect || !status) return;
  
  const planId = planSelect.value;
  const dayName = daySelect.value;
  const exercises = getExercisesForDay(planId, dayName);
  const today = new Date().toISOString().split("T")[0];
  let errors = 0;

  for (const ex of exercises) {
    const name = ex.Exercise.replace(/\s*\(.*?\)/, "");
    const input = document.getElementById(`rep-${name}`);
    if (!input) continue;
    
    const reps = input.value || "0";

    const data = {
      UserId: getCurrentUserId(),
      Date: today,
      PlanId: planId,
      Day: dayName,
      Exercise: name,
      Reps: reps
    };

    const success = await postToSheet('UserHistory', data);
    if (!success) errors++;
  }

  status.textContent = errors === 0 ? "✅ Progress saved!" : "⚠️ Error saving progress.";
  setTimeout(() => status.textContent = "", 3000);
  
  // Reload data to update history
  await loadAllTables();
  if (document.getElementById('section-history').style.display !== 'none') {
    renderHistory();
  }
}

// --- Navigation & App Initialization ---
function showSection(section) {
  const sections = ['workout', 'history', 'equipment', 'progressions'];
  sections.forEach(s => {
    const el = document.getElementById(`section-${s}`);
    if (el) el.style.display = s === section ? '' : 'none';
  });
  
  if (section === 'workout') renderWorkoutSection();
  if (section === 'history') renderHistory();
  if (section === 'equipment') renderEquipment();
  if (section === 'progressions') renderProgressions();
}

function initializeMainApp() {
  const main = document.querySelector('main');
  main.innerHTML = `
    <section id="section-workout">
      <h1>💪 Workout</h1>
      <label for="plan-select">Select plan:</label>
      <select id="plan-select"></select>
      <label for="day-select">Select day:</label>
      <select id="day-select"></select>
      <div id="exercise-list"></div>
      <button onclick="submitWorkout()">
        <svg width="18" height="18" fill="#fff" style="vertical-align:middle; margin-right:4px;" viewBox="0 0 16 16">
          <path d="M16 2.5a.5.5 0 0 0-.5-.5h-15a.5.5 0 0 0-.5.5v11a.5.5 0 0 0 .5.5h15a.5.5 0 0 0 .5-.5v-11zm-1 0v1.528l-7 4.2-7-4.2V2.5h14zm-14 11V4.972l6.646 3.987a.5.5 0 0 0 .708 0L15 4.972V13.5H1z"/>
        </svg>
        Save Progress
      </button>
      <div id="status"></div>
    </section>
    
    <section id="section-history" style="display:none;">
      <h2>📊 History</h2>
      <div id="history-log"></div>
    </section>
    
    <section id="section-equipment" style="display:none;">
      <h2>🏋️ Equipment</h2>
      <div id="equipment-list"></div>
    </section>
  `;
  
  // Add navigation event listeners
  const navWorkout = document.getElementById('nav-workout');
  const navHistory = document.getElementById('nav-history');
  const navEquipment = document.getElementById('nav-equipment');
  const navProgressions = document.getElementById('nav-progressions');

  if (navWorkout) navWorkout.addEventListener('click', e => { e.preventDefault(); showSection('workout'); });
  if (navHistory) navHistory.addEventListener('click', e => { e.preventDefault(); showSection('history'); });
  if (navEquipment) navEquipment.addEventListener('click', e => { e.preventDefault(); showSection('equipment'); });
  if (navProgressions) navProgressions.addEventListener('click', e => { e.preventDefault(); showSection('progressions'); });
  
  // Show workout by default
  showSection('workout');
}

async function initializeApp() {
  await loadAllTables();
  
  if (needsBaseTest()) {
    renderBaseTestForm();
  } else {
    initializeMainApp();
  }
}

function getMondayDate(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setHours(0,0,0,0) && d.setDate(diff));
}

// --- App Start ---
document.addEventListener('DOMContentLoaded', initializeApp);
