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
  currentUser: 'default_user'
};

// --- Fetch Functions ---
async function fetchSheet(sheet) {
  try {
    showNotification(`Loading ${sheet}...`, 'info');
    console.log(`Fetching ${sheet} from:`, `${SHEETS_API}?sheet=${sheet}`);
    
    const response = await fetch(`${SHEETS_API}?sheet=${sheet}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`${sheet} data received:`, data);
    
    if (data.error) {
      throw new Error(`API Error: ${data.error}`);
    }
    
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(`Error fetching ${sheet}:`, error);
    showNotification(`Failed to load ${sheet}: ${error.message}`, 'error');
    return [];
  }
}

async function postToSheet(sheet, data) {
  try {
    console.log(`Posting to ${sheet}:`, data);
    
    const response = await fetch(`${SHEETS_API}?sheet=${sheet}`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    console.log(`Post result for ${sheet}:`, result);
    
    if (result.error) {
      throw new Error(`API Error: ${result.error}`);
    }
    
    showNotification(`Data saved to ${sheet}!`, 'success');
    return result;
  } catch (error) {
    console.error(`Error posting to ${sheet}:`, error);
    showNotification(`Failed to save to ${sheet}: ${error.message}`, 'error');
    return {success: false, error: error.message};
  }
}

// --- Notification System ---
function showNotification(message, type = 'info') {
  // Remove existing notifications
  const existing = document.querySelector('.notification');
  if (existing) existing.remove();
  
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    background: ${type === 'error' ? '#f85149' : type === 'success' ? '#3fb950' : '#58a6ff'};
    color: white;
    border-radius: 6px;
    font-weight: 500;
    z-index: 1000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    max-width: 300px;
    word-wrap: break-word;
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 5000);
}

function showLoadingState() {
  const main = document.querySelector('main');
  main.innerHTML = `
    <div style="text-align: center; padding: 3rem;">
      <div style="font-size: 3rem; margin-bottom: 1rem;">⏳</div>
      <h2>Loading Calisthenics Tracker...</h2>
      <p style="color: #888;">Connecting to Google Sheets...</p>
    </div>
  `;
}

async function loadAllTables() {
  console.log("Loading all tables from Google Sheets...");
  
  // Load all data in parallel
  const [plans, planExercises, userHistory, equipment, users, progressions, baseTest] = await Promise.all([
    fetchSheet('TrainingPlans'),
    fetchSheet('TrainingPlanExercises'),
    fetchSheet('UserHistory'),
    fetchSheet('Equipment'),
    fetchSheet('Users'),
    fetchSheet('Progressions'),
    fetchSheet('BaseTest')
  ]);
  
  // Update app state
  appState.plans = plans;
  appState.planExercises = planExercises;
  appState.userHistory = userHistory;
  appState.equipment = equipment;
  appState.users = users;
  appState.progressions = progressions;
  appState.baseTest = baseTest;
  
  console.log("All data loaded:", appState);
}

// --- Base Test Logic ---
function needsBaseTest() {
  const userBaseTest = appState.baseTest.filter(test => 
    test.user_id === appState.currentUser || test.user_id === 'default_user'
  );
  
  if (userBaseTest.length === 0) return true;
  
  // Check if last test is older than 2 months
  const lastTest = userBaseTest.sort((a, b) => new Date(b.test_date) - new Date(a.test_date))[0];
  const lastTestDate = new Date(lastTest.test_date);
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
  
  return lastTestDate < twoMonthsAgo;
}

function renderBaseTestForm() {
  const main = document.querySelector('main');
  
  main.innerHTML = `
    <div style="max-width: 600px; margin: 0 auto; padding: 2rem;">
      <h1>🏋️ Base Test Required</h1>
      <p>Before starting your training, we need to assess your current fitness level. Perform a maximum effort test for each exercise:</p>
      
      <form id="base-test-form">
        <div class="exercise-test">
          <label for="pushups">Push-ups (max reps in 2 minutes):</label>
          <input type="number" id="pushups" min="0" required>
        </div>
        
        <div class="exercise-test">
          <label for="pullups">Pull-ups (max reps):</label>
          <input type="number" id="pullups" min="0" required>
        </div>
        
        <div class="exercise-test">
          <label for="squats">Squats (max reps in 2 minutes):</label>
          <input type="number" id="squats" min="0" required>
        </div>
        
        <div class="exercise-test">
          <label for="plank">Plank (max seconds):</label>
          <input type="number" id="plank" min="0" required>
        </div>
        
        <div class="exercise-test">
          <label for="situps">Sit-ups (max reps in 2 minutes):</label>
          <input type="number" id="situps" min="0" required>
        </div>
        
        <div class="exercise-test">
          <label for="burpees">Burpees (max reps in 5 minutes):</label>
          <input type="number" id="burpees" min="0" required>
        </div>
        
        <button type="submit" style="margin-top: 2rem; width: 100%;">
          Save Base Test Results
        </button>
      </form>
      
      <div style="margin-top: 2rem; padding: 1rem; background: #1f2937; border-radius: 6px;">
        <h3>💡 Tips for Base Test:</h3>
        <ul>
          <li>Warm up properly before starting</li>
          <li>Use proper form for all exercises</li>
          <li>Rest 2-3 minutes between exercises</li>
          <li>Record your maximum effort for each</li>
        </ul>
      </div>
    </div>
  `;
  
  document.getElementById('base-test-form').addEventListener('submit', handleBaseTestSubmit);
}

async function handleBaseTestSubmit(e) {
  e.preventDefault();
  
  const exercises = ['pushups', 'pullups', 'squats', 'plank', 'situps', 'burpees'];
  const testDate = new Date().toISOString();
  
  // Save each exercise result
  for (const exercise of exercises) {
    const maxReps = document.getElementById(exercise).value;
    
    const baseTestData = {
      id: Date.now() + Math.random(),
      user_id: appState.currentUser,
      exercise_name: exercise,
      max_reps: parseInt(maxReps),
      test_date: testDate
    };
    
    await postToSheet('BaseTest', baseTestData);
    
    // Also create initial progression entry
    const progressionData = {
      id: Date.now() + Math.random() + 1,
      user_id: appState.currentUser,
      exercise_name: exercise,
      level: 1,
      max_reps: parseInt(maxReps),
      updated_at: testDate
    };
    
    await postToSheet('Progressions', progressionData);
  }
  
  showNotification('Base test completed! Loading your personalized program...', 'success');
  
  // Reload data and show main app
  await loadAllTables();
  initializeMainApp();
}

// --- Progressions Logic ---
function calculateExpectedReps(exercise, currentLevel, baseTestReps) {
  // Each level increases expected reps by 20%
  const progressionMultiplier = 1 + (currentLevel - 1) * 0.2;
  return Math.ceil(baseTestReps * progressionMultiplier);
}

function getUserProgression(exerciseName) {
  return appState.progressions.find(p => 
    p.user_id === appState.currentUser && p.exercise_name === exerciseName
  );
}

function getUserBaseTest(exerciseName) {
  const userTests = appState.baseTest.filter(test => 
    test.user_id === appState.currentUser && test.exercise_name === exerciseName
  );
  
  if (userTests.length === 0) return null;
  
  // Return the most recent test
  return userTests.sort((a, b) => new Date(b.test_date) - new Date(a.test_date))[0];
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
    
    <section id="section-progressions" style="display:none;">
      <h2>📈 Progress</h2>
      <div id="progressions-content"></div>
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

// --- Workout Section ---
function renderWorkoutSection() {
  populatePlans();
  populateDays();
  populateExercises();
}

function populatePlans() {
  const planSelect = document.getElementById('plan-select');
  if (!planSelect) return;
  
  planSelect.innerHTML = '<option value="">Select a plan</option>';
  appState.plans.forEach(plan => {
    const option = document.createElement('option');
    option.value = plan.id;
    option.textContent = plan.name;
    planSelect.appendChild(option);
  });
  
  planSelect.addEventListener('change', populateExercises);
}

function populateDays() {
  const daySelect = document.getElementById('day-select');
  if (!daySelect) return;
  
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  daySelect.innerHTML = '<option value="">Select a day</option>';
  days.forEach(day => {
    const option = document.createElement('option');
    option.value = day;
    option.textContent = day;
    daySelect.appendChild(option);
  });
  
  daySelect.addEventListener('change', populateExercises);
}

function populateExercises() {
  const planSelect = document.getElementById('plan-select');
  const daySelect = document.getElementById('day-select');
  const exerciseList = document.getElementById('exercise-list');
  
  if (!planSelect || !daySelect || !exerciseList) return;
  
  const selectedPlan = planSelect.value;
  const selectedDay = daySelect.value;
  
  if (!selectedPlan || !selectedDay) {
    exerciseList.innerHTML = '<p>Please select both a plan and a day.</p>';
    return;
  }
  
  const exercises = appState.planExercises.filter(ex => 
    ex.plan_id == selectedPlan && ex.day === selectedDay
  );
  
  if (exercises.length === 0) {
    exerciseList.innerHTML = '<p>No exercises found for this plan and day.</p>';
    return;
  }
  
  exerciseList.innerHTML = exercises.map(exercise => {
    // Get user progression and base test for smart rep suggestion
    const progression = getUserProgression(exercise.exercise_name);
    const baseTest = getUserBaseTest(exercise.exercise_name);
    
    let suggestedReps = exercise.reps;
    if (progression && baseTest) {
      suggestedReps = calculateExpectedReps(
        exercise.exercise_name,
        progression.level,
        baseTest.max_reps
      );
    }
    
    return `
      <div class="exercise-item">
        <h3>${exercise.exercise_name}</h3>
        <div class="exercise-details">
          <label>Sets: <input type="number" id="sets-${exercise.id}" value="${exercise.sets}" min="1"></label>
          <label>Reps: <input type="number" id="reps-${exercise.id}" value="${suggestedReps}" min="1" placeholder="${exercise.reps}"></label>
          <label>Weight (kg): <input type="number" id="weight-${exercise.id}" value="0" min="0" step="0.5"></label>
        </div>
        ${progression ? `<p class="progression-info">📈 Level ${progression.level} | Target: ${suggestedReps} reps</p>` : ''}
      </div>
    `;
  }).join('');
}

async function submitWorkout() {
  const planSelect = document.getElementById('plan-select');
  const daySelect = document.getElementById('day-select');
  
  if (!planSelect?.value || !daySelect?.value) {
    showNotification('Please select a plan and day first.', 'error');
    return;
  }
  
  const exercises = appState.planExercises.filter(ex => 
    ex.plan_id == planSelect.value && ex.day === daySelect.value
  );
  
  const workoutData = [];
  let hasData = false;
  
  for (const exercise of exercises) {
    const sets = document.getElementById(`sets-${exercise.id}`)?.value;
    const reps = document.getElementById(`reps-${exercise.id}`)?.value;
    const weight = document.getElementById(`weight-${exercise.id}`)?.value;
    
    if (sets && reps) {
      hasData = true;
      const historyEntry = {
        id: Date.now() + Math.random(),
        user_id: appState.currentUser,
        exercise_name: exercise.exercise_name,
        sets: parseInt(sets),
        reps: parseInt(reps),
        weight: parseFloat(weight) || 0,
        date: new Date().toISOString()
      };
      
      workoutData.push(historyEntry);
    }
  }
  
  if (!hasData) {
    showNotification('Please fill in at least one exercise.', 'error');
    return;
  }
  
  // Save all workout data
  for (const entry of workoutData) {
    await postToSheet('UserHistory', entry);
    
    // Update progression if performance improved
    await updateProgression(entry);
  }
  
  showNotification('Workout saved successfully!', 'success');
  
  // Reload data to reflect changes
  await loadAllTables();
  if (document.getElementById('section-history').style.display !== 'none') {
    renderHistory();
  }
}

async function updateProgression(workoutEntry) {
  const progression = getUserProgression(workoutEntry.exercise_name);
  const baseTest = getUserBaseTest(workoutEntry.exercise_name);
  
  if (!progression || !baseTest) return;
  
  const currentExpected = calculateExpectedReps(
    workoutEntry.exercise_name,
    progression.level,
    baseTest.max_reps
  );
  
  // If user performed significantly better, level up
  if (workoutEntry.reps >= currentExpected * 1.5) {
    const newProgressionData = {
      id: progression.id,
      user_id: appState.currentUser,
      exercise_name: workoutEntry.exercise_name,
      level: progression.level + 1,
      max_reps: Math.max(progression.max_reps, workoutEntry.reps),
      updated_at: new Date().toISOString()
    };
    
    await postToSheet('Progressions', newProgressionData);
    showNotification(`🎉 Level up in ${workoutEntry.exercise_name}! Now level ${progression.level + 1}`, 'success');
  }
}

// --- History Section ---
function renderHistory() {
  const historyLog = document.getElementById('history-log');
  if (!historyLog) return;
  
  const userHistory = appState.userHistory.filter(entry => 
    entry.user_id === appState.currentUser
  );
  
  if (userHistory.length === 0) {
    historyLog.innerHTML = '<p>No workout history yet. Start training to see your progress here!</p>';
    return;
  }
  
  // Group by week
  const weekGroups = {};
  userHistory.forEach(entry => {
    const weekStart = getMondayDate(new Date(entry.date));
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!weekGroups[weekKey]) {
      weekGroups[weekKey] = [];
    }
    weekGroups[weekKey].push(entry);
  });
  
  historyLog.innerHTML = Object.keys(weekGroups)
    .sort((a, b) => new Date(b) - new Date(a))
    .map(weekKey => {
      const entries = weekGroups[weekKey];
      const weekStart = new Date(weekKey);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      return `
        <div class="week-group">
          <h3>Week of ${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}</h3>
          <div class="history-entries">
            ${entries.map(entry => `
              <div class="history-entry">
                <span class="exercise-name">${entry.exercise_name}</span>
                <span class="sets-reps">${entry.sets} sets × ${entry.reps} reps</span>
                ${entry.weight > 0 ? `<span class="weight">${entry.weight}kg</span>` : ''}
                <span class="date">${new Date(entry.date).toLocaleDateString()}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }).join('');
}

// --- Equipment Section ---
function renderEquipment() {
  const equipmentList = document.getElementById('equipment-list');
  if (!equipmentList) return;
  
  if (appState.equipment.length === 0) {
    equipmentList.innerHTML = '<p>No equipment data available.</p>';
    return;
  }
  
  equipmentList.innerHTML = appState.equipment.map(item => `
    <div class="equipment-item">
      <h3>${item.Name || item.name}</h3>
      <p>${item.Description || item.description || 'No description available'}</p>
      <span class="equipment-status ${item.available === 'true' ? 'available' : 'unavailable'}">
        ${item.available === 'true' ? '✅ Available' : '❌ Unavailable'}
      </span>
    </div>
  `).join('');
}

// --- Progressions Section ---
function renderProgressions() {
  const progressionsContent = document.getElementById('progressions-content');
  if (!progressionsContent) return;
  
  const userProgressions = appState.progressions.filter(p => 
    p.user_id === appState.currentUser
  );
  
  if (userProgressions.length === 0) {
    progressionsContent.innerHTML = '<p>No progression data yet. Complete a base test to start tracking your progress!</p>';
    return;
  }
  
  progressionsContent.innerHTML = `
    <div class="progressions-grid">
      ${userProgressions.map(progression => {
        const baseTest = getUserBaseTest(progression.exercise_name);
        const expectedReps = baseTest ? calculateExpectedReps(
          progression.exercise_name,
          progression.level,
          baseTest.max_reps
        ) : 0;
        
        return `
          <div class="progression-card">
            <h3>${progression.exercise_name}</h3>
            <div class="progression-stats">
              <div class="stat">
                <span class="label">Current Level:</span>
                <span class="value">${progression.level}</span>
              </div>
              <div class="stat">
                <span class="label">Max Reps:</span>
                <span class="value">${progression.max_reps}</span>
              </div>
              <div class="stat">
                <span class="label">Target Reps:</span>
                <span class="value">${expectedReps}</span>
              </div>
              <div class="stat">
                <span class="label">Last Updated:</span>
                <span class="value">${new Date(progression.updated_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function getMondayDate(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setHours(0,0,0,0) && d.setDate(diff));
}

// --- App Initialization ---
async function initializeApp() {
  console.log("🚀 Starting Calisthenics Tracker...");
  
  showLoadingState();
  
  try {
    await loadAllTables();
    
    // Check if user needs base test
    if (needsBaseTest()) {
      console.log("📋 Base test required");
      renderBaseTestForm();
    } else {
      console.log("✅ Base test complete, showing main app");
      initializeMainApp();
    }
    
  } catch (error) {
    console.error("❌ Failed to initialize app:", error);
    const main = document.querySelector('main');
    main.innerHTML = `
      <div style="text-align: center; padding: 3rem;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">❌</div>
        <h2>Failed to Load Application</h2>
        <p style="color: #888;">Please check your internet connection and try again.</p>
        <button onclick="location.reload()" style="margin-top: 1rem;">Retry</button>
      </div>
    `;
  }
}

// Start the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);
