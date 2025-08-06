const treningove_dni = {
  "Deň 1 – Nohy + Core": ["Pistol squat", "Wall sit (60s)", "Calf raises", "Leg raises", "Plank (60s)"],
  "Deň 2 – Hrudník + Triceps + L-sit": ["Incline push-ups", "Dipy", "Diamond push-ups", "L-sit (30s)", "Knee raises"],
  "Deň 3 – Chrbát + Biceps": ["Pull-ups", "Negative muscle-ups", "Australian rows", "Chin-ups", "Dead hang (30s)"],
  "Deň 4 – Beh + Ramena + Core": ["Pike push-ups", "Plank to push-up", "Shoulder taps", "Bird-dog"],
  "Deň 5 – Hrudník + Nohy": ["Push-ups", "Dipy", "Wide push-ups", "Wall sit (60s)", "Leg raises"]
};

const days = Object.keys(treningove_dni);
const apiUrl = "https://script.google.com/macros/s/AKfycbwiDlSFZIVr5m9B98GXuXpXOEd43Cn4tY4Ug6MNWGB4ebMHTJDPxlVmda9ModBrNT06/exec";

const daySelect = document.getElementById("day-select");
const exerciseList = document.getElementById("exercise-list");
const status = document.getElementById("status");
const historyLog = document.getElementById("history-log");

// Fill dropdown
days.forEach(d => {
  const opt = document.createElement("option");
  opt.value = d;
  opt.textContent = d;
  daySelect.appendChild(opt);
});

daySelect.addEventListener("change", () => {
  renderExercises(daySelect.value);
});

// Init on load
init();

// Render exercise input fields
function renderExercises(dayName, lastReps = {}) {
  const exercises = treningove_dni[dayName];
  exerciseList.innerHTML = "";

  exercises.forEach(ex => {
    const isTimer = ex.includes("(");
    const name = ex.replace(/\s*\(.*?\)/, "");
    const wrapper = document.createElement("div");
    wrapper.className = "exercise";

    const label = document.createElement("label");
    label.textContent = ex;

    const input = document.createElement("input");
    input.id = `rep-${name}`;
    input.type = "number";
    input.min = 0;
    input.placeholder = isTimer ? "sekundy" : "opakovania";

    if (lastReps[name]) {
      input.value = lastReps[name];
    }

    wrapper.appendChild(label);
    wrapper.appendChild(input);

    // Add timer button if timed
    if (isTimer) {
      const timeInSec = parseInt(ex.match(/\((\d+)s\)/)?.[1] || "0");
      const timerBtn = document.createElement("button");
      timerBtn.textContent = `▶️ ${timeInSec}s`;
      timerBtn.className = "timer-btn";
      timerBtn.onclick = () => startTimer(timerBtn, timeInSec);
      wrapper.appendChild(timerBtn);
    }

    exerciseList.appendChild(wrapper);
  });
}

// Start countdown timer
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

// Submit workout
async function submitWorkout() {
  const dayName = daySelect.value;
  const exercises = treningove_dni[dayName];
  const today = new Date().toISOString().split("T")[0];
  let errors = 0;

  for (const ex of exercises) {
    const name = ex.replace(/\s*\(.*?\)/, "");
    const reps = document.getElementById(`rep-${name}`).value || "0";

    const data = {
      Date: today,
      Day: dayName,
      Exercise: name,
      Reps: reps
    };

    try {
      await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(data)
      });
    } catch {
      errors++;
    }
  }

  status.textContent = errors === 0 ? "✅ Progres uložený!" : "⚠️ Chyba pri ukladaní.";
  setTimeout(() => status.textContent = "", 3000);
  fetchHistory();
}

// Fetch last week’s progress
async function fetchHistory() {
  try {
    const res = await fetch(apiUrl);
    const data = await res.json();

    const thisWeekStart = getMondayDate(new Date());
    const weekData = data.filter(row => new Date(row.Date) >= thisWeekStart);
    const recentByDay = {};

    for (const entry of weekData) {
      if (!recentByDay[entry.Day]) recentByDay[entry.Day] = [];
      recentByDay[entry.Day].push(`${entry.Exercise}: ${entry.Reps}`);
    }

    historyLog.innerHTML = "";
    for (const day of days) {
      if (recentByDay[day]) {
        const block = document.createElement("div");
        block.className = "history-entry";
        block.innerHTML = `<strong>${day}</strong><br>${recentByDay[day].join("<br>")}`;
        historyLog.appendChild(block);
      }
    }
  } catch (e) {
    historyLog.innerHTML = "⚠️ Nepodarilo sa načítať históriu.";
  }
}

// Auto-select next day & preload previous values
async function init() {
  const progress = await fetchProgress();
  const thisWeekStart = getMondayDate(new Date());
  const weekRows = progress.filter(r => new Date(r.Date) >= thisWeekStart);

  const completedDays = new Set(weekRows.map(r => r.Day));
  const nextDayIndex = days.findIndex(d => !completedDays.has(d));
  const dayToLoad = days[nextDayIndex] || days[0];

  daySelect.value = dayToLoad;

  // Suggest last reps per exercise
  const lastValues = {};
  for (const ex of treningove_dni[dayToLoad]) {
    const name = ex.replace(/\s*\(.*?\)/, "");
    const recent = [...progress].reverse().find(r => r.Exercise === name);
    if (recent) lastValues[name] = recent.Reps;
  }

  renderExercises(dayToLoad, lastValues);
  fetchHistory();
}

// Get full progress
async function fetchProgress() {
  try {
    const res = await fetch(apiUrl);
    return await res.json();
  } catch {
    return [];
  }
}

// Get Monday of current week
function getMondayDate(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}
