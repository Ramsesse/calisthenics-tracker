const API_URL = "https://script.google.com/macros/s/AKfycbwiDlSFZIVr5m9B98GXuXpXOEd43Cn4tY4Ug6MNWGB4ebMHTJDPxlVmda9ModBrNT06/exec";

const treningove_dni = {
  "Deň 1 – Nohy + Core": ["Pistol squat", "Wall sit", "Calf raises", "Leg raises", "Plank"],
  "Deň 2 – Hrudník + Triceps + L-sit": ["Incline push-ups", "Dipy", "Diamond push-ups", "L-sit", "Knee raises"],
  "Deň 3 – Chrbát + Biceps": ["Pull-ups", "Negative muscle-ups", "Australian rows", "Chin-ups", "Dead hang"],
  "Deň 4 – Beh + Ramena + Core": ["Pike push-ups", "Plank to push-up", "Shoulder taps", "Bird-dog"],
  "Deň 5 – Hrudník + Nohy": ["Push-ups", "Dipy", "Wide push-ups", "Wall sit", "Leg raises"]
};

async function addTrainingPlan() {
  try {
    console.log("🚀 Adding comprehensive 5-day training plan...");
    
    // 1. Add the training plan
    const planData = {
      PlanID: 2,
      UserID: 1,
      Name: "Kompletný 5-dňový plán",
      Description: "Profesionálny tréningový plán pre rozvoj sily a vytrvalosti",
      DifficultyLevel: "Intermediate",
      DurationWeeks: 8
    };
    
    console.log("Adding training plan:", planData);
    const planResponse = await fetch(`${API_URL}?sheet=TrainingPlans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(planData)
    });
    
    if (!planResponse.ok) {
      throw new Error(`Failed to add plan: ${planResponse.status}`);
    }
    
    console.log("✅ Training plan added successfully");
    
    // 2. Add exercises for each day
    let exerciseId = 1;
    for (const [dayName, exercises] of Object.entries(treningove_dni)) {
      const dayNumber = Object.keys(treningove_dni).indexOf(dayName) + 1;
      
      console.log(`\n📅 Adding Day ${dayNumber}: ${dayName}`);
      
      for (const exercise of exercises) {
        const exerciseData = {
          PlanID: 2,
          Day: dayNumber,
          ExerciseName: exercise,
          Sets: 3,
          Reps: 12,
          RestSeconds: 60,
          MuscleGroup: getMuscleGroup(exercise),
          EquipmentRequired: getEquipment(exercise)
        };
        
        console.log(`  💪 Adding: ${exercise}`);
        
        const exerciseResponse = await fetch(`${API_URL}?sheet=TrainingPlanExercises`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(exerciseData)
        });
        
        if (!exerciseResponse.ok) {
          console.error(`Failed to add exercise ${exercise}:`, exerciseResponse.status);
        } else {
          console.log(`    ✅ Added successfully`);
        }
        
        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 500));
        exerciseId++;
      }
    }
    
    console.log("\n🎉 Complete 5-day training plan added successfully!");
    console.log("\nTraining Plan Structure:");
    for (const [dayName, exercises] of Object.entries(treningove_dni)) {
      console.log(`${dayName}:`);
      exercises.forEach(ex => console.log(`  - ${ex}`));
    }
    
  } catch (error) {
    console.error("❌ Error adding training plan:", error);
  }
}

function getMuscleGroup(exercise) {
  const muscleGroups = {
    "Pistol squat": "Legs",
    "Wall sit": "Legs", 
    "Calf raises": "Legs",
    "Leg raises": "Core",
    "Plank": "Core",
    "Incline push-ups": "Chest",
    "Dipy": "Triceps",
    "Diamond push-ups": "Chest/Triceps",
    "L-sit": "Core",
    "Knee raises": "Core",
    "Pull-ups": "Back",
    "Negative muscle-ups": "Back/Arms",
    "Australian rows": "Back",
    "Chin-ups": "Back/Biceps",
    "Dead hang": "Back/Grip",
    "Pike push-ups": "Shoulders",
    "Plank to push-up": "Core/Chest",
    "Shoulder taps": "Shoulders/Core",
    "Bird-dog": "Core",
    "Push-ups": "Chest",
    "Wide push-ups": "Chest"
  };
  
  return muscleGroups[exercise] || "Full Body";
}

function getEquipment(exercise) {
  const equipment = {
    "Pull-ups": "Pull-up bar",
    "Negative muscle-ups": "Pull-up bar",
    "Australian rows": "Low bar",
    "Chin-ups": "Pull-up bar", 
    "Dead hang": "Pull-up bar",
    "Dipy": "Parallel bars or chair"
  };
  
  return equipment[exercise] || "None";
}

// Run the function
addTrainingPlan();
