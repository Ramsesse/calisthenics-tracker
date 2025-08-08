// === SIMPLIFIED AND RELIABLE GOOGLE APPS SCRIPT ===
// Copy this entire code to your Google Apps Script project

function doGet(e) {
  try {
    console.log('doGet called with parameters:', JSON.stringify(e ? e.parameter : 'no params'));
    
    // Add CORS headers
    const output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);
    
    // Handle case when no parameters
    if (!e || !e.parameter) {
      console.log('No parameters provided');
      return output.setContent(JSON.stringify({error: 'No parameters provided'}));
    }
    
    const sheet = e.parameter.sheet;
    const action = e.parameter.action;
    
    if (!sheet) {
      console.log('Missing sheet parameter');
      return output.setContent(JSON.stringify({error: 'Missing sheet parameter'}));
    }
    
    // Handle save action
    if (action === 'save') {
      console.log('Saving data to sheet:', sheet);
      
      // Extract data from parameters
      const data = {};
      for (const key in e.parameter) {
        if (key !== 'sheet' && key !== 'action') {
          data[key] = e.parameter[key];
        }
      }
      
      console.log('Data to save:', JSON.stringify(data));
      const result = saveToSheet(sheet, data);
      return output.setContent(JSON.stringify({success: true, message: 'Data saved successfully'}));
    }
    
    // Default: get data
    console.log('Getting data for sheet:', sheet);
    const data = getSheetData(sheet);
    console.log('Data retrieved:', data.length, 'records');
    
    return output.setContent(JSON.stringify(data));
      
  } catch (error) {
    console.log('doGet Error:', error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  return doGet(e);  // Redirect POST to GET for simplicity
}

function getSheetData(sheetName) {
  try {
    console.log('Getting data from sheet:', sheetName);
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(sheetName);
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      console.log('Sheet not found, creating:', sheetName);
      sheet = ss.insertSheet(sheetName);
      
      // Add headers
      const headers = getDefaultHeaders(sheetName);
      if (headers.length > 0) {
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        console.log('Added headers:', headers.join(', '));
      }
      return []; // Return empty array for new sheet
    }
    
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      console.log('No data found in sheet');
      return [];
    }
    
    const lastCol = sheet.getLastColumn();
    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    const dataRange = sheet.getRange(2, 1, lastRow - 1, lastCol);
    const data = dataRange.getValues();
    
    console.log('Headers:', headers.join(', '));
    console.log('Data rows:', data.length);
    
    // Convert to array of objects
    const result = data.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });
    
    return result;
    
  } catch (error) {
    console.log('getSheetData Error:', error.toString());
    throw error;
  }
}

function saveToSheet(sheetName, data) {
  try {
    console.log('Saving data to sheet:', sheetName);
    console.log('Data:', JSON.stringify(data));
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(sheetName);
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      console.log('Sheet not found, creating:', sheetName);
      sheet = ss.insertSheet(sheetName);
      
      // Add headers
      const headers = getDefaultHeaders(sheetName);
      if (headers.length > 0) {
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        console.log('Added headers:', headers.join(', '));
      }
    }
    
    // Get headers
    const lastCol = Math.max(sheet.getLastColumn(), 1);
    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    console.log('Current headers:', headers.join(', '));
    
    // If no headers exist, create them from data keys
    if (headers.length === 0 || headers[0] === '') {
      const dataKeys = Object.keys(data);
      sheet.getRange(1, 1, 1, dataKeys.length).setValues([dataKeys]);
      console.log('Created new headers:', dataKeys.join(', '));
    }
    
    // Get updated headers
    const currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // Prepare row data
    const rowData = currentHeaders.map(header => data[header] || '');
    console.log('Row data:', rowData.join(', '));
    
    // Add data to next row
    const nextRow = sheet.getLastRow() + 1;
    sheet.getRange(nextRow, 1, 1, rowData.length).setValues([rowData]);
    
    console.log('Data saved to row:', nextRow);
    return true;
    
  } catch (error) {
    console.log('saveToSheet Error:', error.toString());
    throw error;
  }
}

function getDefaultHeaders(sheetName) {
  const headerMap = {
    'TrainingPlans': ['PlanID', 'UserID', 'Name', 'Description', 'DifficultyLevel', 'DurationWeeks'],
    'TrainingPlanExercises': ['PlanID', 'Day', 'ExerciseName', 'Sets', 'Reps', 'RestSeconds', 'MuscleGroup', 'EquipmentRequired'],
    'UserHistory': ['id', 'user_id', 'exercise_name', 'sets', 'reps', 'weight', 'date'],
    'BaseTest': ['id', 'user_id', 'exercise_name', 'max_reps', 'test_date'],
    'Progressions': ['id', 'user_id', 'exercise_name', 'level', 'max_reps', 'updated_at'],
    'Equipment': ['id', 'name', 'description', 'available'],
    'Users': ['id', 'username', 'email', 'created_at']
  };
  
  return headerMap[sheetName] || [];
}

// Test function
function testFunction() {
  console.log('Test function called - Google Apps Script is working!');
  return 'SUCCESS: Google Apps Script is working!';
}
