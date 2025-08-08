// Offline Storage Solution - Local Storage Backup
class OfflineStorage {
  constructor() {
    this.prefix = 'calisthenics_';
    this.init();
  }

  init() {
    // Initialize with default data if nothing exists
    if (!this.hasData()) {
      this.createDefaultData();
    }
  }

  hasData() {
    return localStorage.getItem(this.prefix + 'initialized') === 'true';
  }

  createDefaultData() {
    console.log('🔧 Creating default offline data...');
    
    // Default training plans
    const defaultPlans = [
      {
        PlanID: 1,
        UserID: 1,
        Name: "Základný plán",
        Description: "Základný tréningový plán pre začiatočníkov",
        DifficultyLevel: "Beginner",
        DurationWeeks: 4
      },
      {
        PlanID: 2,
        UserID: 1,
        Name: "Kompletný 5-dňový plán",
        Description: "Profesionálny tréningový plán pre rozvoj sily a vytrvalosti",
        DifficultyLevel: "Intermediate",
        DurationWeeks: 8
      }
    ];

    // 5-day training plan exercises
    const defaultExercises = [
      // Day 1 - Nohy + Core
      { PlanID: 2, Day: 1, ExerciseName: "Pistol squat", Sets: 3, Reps: 5, RestSeconds: 60, MuscleGroup: "Legs", EquipmentRequired: "None" },
      { PlanID: 2, Day: 1, ExerciseName: "Wall sit", Sets: 3, Reps: 30, RestSeconds: 60, MuscleGroup: "Legs", EquipmentRequired: "None" },
      { PlanID: 2, Day: 1, ExerciseName: "Calf raises", Sets: 3, Reps: 15, RestSeconds: 60, MuscleGroup: "Legs", EquipmentRequired: "None" },
      { PlanID: 2, Day: 1, ExerciseName: "Leg raises", Sets: 3, Reps: 10, RestSeconds: 60, MuscleGroup: "Core", EquipmentRequired: "None" },
      { PlanID: 2, Day: 1, ExerciseName: "Plank", Sets: 3, Reps: 30, RestSeconds: 60, MuscleGroup: "Core", EquipmentRequired: "None" },
      
      // Day 2 - Hrudník + Triceps + L-sit
      { PlanID: 2, Day: 2, ExerciseName: "Incline push-ups", Sets: 3, Reps: 12, RestSeconds: 60, MuscleGroup: "Chest", EquipmentRequired: "None" },
      { PlanID: 2, Day: 2, ExerciseName: "Dipy", Sets: 3, Reps: 8, RestSeconds: 60, MuscleGroup: "Triceps", EquipmentRequired: "Parallel bars or chair" },
      { PlanID: 2, Day: 2, ExerciseName: "Diamond push-ups", Sets: 3, Reps: 8, RestSeconds: 60, MuscleGroup: "Chest/Triceps", EquipmentRequired: "None" },
      { PlanID: 2, Day: 2, ExerciseName: "L-sit", Sets: 3, Reps: 15, RestSeconds: 60, MuscleGroup: "Core", EquipmentRequired: "None" },
      { PlanID: 2, Day: 2, ExerciseName: "Knee raises", Sets: 3, Reps: 10, RestSeconds: 60, MuscleGroup: "Core", EquipmentRequired: "None" },
      
      // Day 3 - Chrbát + Biceps
      { PlanID: 2, Day: 3, ExerciseName: "Pull-ups", Sets: 3, Reps: 6, RestSeconds: 60, MuscleGroup: "Back", EquipmentRequired: "Pull-up bar" },
      { PlanID: 2, Day: 3, ExerciseName: "Negative muscle-ups", Sets: 3, Reps: 3, RestSeconds: 60, MuscleGroup: "Back/Arms", EquipmentRequired: "Pull-up bar" },
      { PlanID: 2, Day: 3, ExerciseName: "Australian rows", Sets: 3, Reps: 10, RestSeconds: 60, MuscleGroup: "Back", EquipmentRequired: "Low bar" },
      { PlanID: 2, Day: 3, ExerciseName: "Chin-ups", Sets: 3, Reps: 6, RestSeconds: 60, MuscleGroup: "Back/Biceps", EquipmentRequired: "Pull-up bar" },
      { PlanID: 2, Day: 3, ExerciseName: "Dead hang", Sets: 3, Reps: 20, RestSeconds: 60, MuscleGroup: "Back/Grip", EquipmentRequired: "Pull-up bar" },
      
      // Day 4 - Beh + Ramena + Core
      { PlanID: 2, Day: 4, ExerciseName: "Pike push-ups", Sets: 3, Reps: 8, RestSeconds: 60, MuscleGroup: "Shoulders", EquipmentRequired: "None" },
      { PlanID: 2, Day: 4, ExerciseName: "Plank to push-up", Sets: 3, Reps: 8, RestSeconds: 60, MuscleGroup: "Core/Chest", EquipmentRequired: "None" },
      { PlanID: 2, Day: 4, ExerciseName: "Shoulder taps", Sets: 3, Reps: 16, RestSeconds: 60, MuscleGroup: "Shoulders/Core", EquipmentRequired: "None" },
      { PlanID: 2, Day: 4, ExerciseName: "Bird-dog", Sets: 3, Reps: 10, RestSeconds: 60, MuscleGroup: "Core", EquipmentRequired: "None" },
      
      // Day 5 - Hrudník + Nohy
      { PlanID: 2, Day: 5, ExerciseName: "Push-ups", Sets: 3, Reps: 12, RestSeconds: 60, MuscleGroup: "Chest", EquipmentRequired: "None" },
      { PlanID: 2, Day: 5, ExerciseName: "Dipy", Sets: 3, Reps: 8, RestSeconds: 60, MuscleGroup: "Triceps", EquipmentRequired: "Parallel bars or chair" },
      { PlanID: 2, Day: 5, ExerciseName: "Wide push-ups", Sets: 3, Reps: 10, RestSeconds: 60, MuscleGroup: "Chest", EquipmentRequired: "None" },
      { PlanID: 2, Day: 5, ExerciseName: "Wall sit", Sets: 3, Reps: 30, RestSeconds: 60, MuscleGroup: "Legs", EquipmentRequired: "None" },
      { PlanID: 2, Day: 5, ExerciseName: "Leg raises", Sets: 3, Reps: 10, RestSeconds: 60, MuscleGroup: "Core", EquipmentRequired: "None" }
    ];

    // Save to localStorage
    this.saveData('TrainingPlans', defaultPlans);
    this.saveData('TrainingPlanExercises', defaultExercises);
    this.saveData('UserHistory', []);
    this.saveData('Progressions', []);
    this.saveData('BaseTest', []);
    this.saveData('Equipment', []);
    this.saveData('Users', [{ id: 1, username: 'default_user', email: '', created_at: new Date().toISOString() }]);
    
    localStorage.setItem(this.prefix + 'initialized', 'true');
    console.log('✅ Default offline data created');
  }

  saveData(sheet, data) {
    localStorage.setItem(this.prefix + sheet, JSON.stringify(data));
    console.log(`💾 Saved ${data.length} records to ${sheet}`);
  }

  getData(sheet) {
    const data = localStorage.getItem(this.prefix + sheet);
    return data ? JSON.parse(data) : [];
  }

  addRecord(sheet, record) {
    const data = this.getData(sheet);
    
    // Add timestamp if not present
    if (!record.id && !record.PlanID) {
      record.id = Date.now() + Math.random();
    }
    
    data.push(record);
    this.saveData(sheet, data);
    return true;
  }

  // Sync methods (for future online/offline sync)
  async syncWithOnline(apiUrl) {
    console.log('🔄 Attempting to sync with online API...');
    
    try {
      // Try to fetch online data
      const response = await fetch(`${apiUrl}?sheet=TrainingPlans`);
      if (response.ok) {
        const onlineData = await response.json();
        console.log('✅ Online sync successful, updating local data');
        this.saveData('TrainingPlans', onlineData);
        return true;
      }
    } catch (error) {
      console.log('📱 Using offline mode:', error.message);
    }
    
    return false;
  }

  exportData() {
    const allData = {};
    const sheets = ['TrainingPlans', 'TrainingPlanExercises', 'UserHistory', 'Progressions', 'BaseTest', 'Equipment', 'Users'];
    
    sheets.forEach(sheet => {
      allData[sheet] = this.getData(sheet);
    });
    
    return allData;
  }

  importData(data) {
    Object.keys(data).forEach(sheet => {
      this.saveData(sheet, data[sheet]);
    });
    console.log('📥 Data imported successfully');
  }
}

// Global offline storage instance
window.offlineStorage = new OfflineStorage();
