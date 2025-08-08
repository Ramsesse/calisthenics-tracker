// === ROBUST GOOGLE APPS SCRIPT WITH DEBUGGING ===
// Copy this entire code to your Google Apps Script project

function doGet(e) {
  try {
    // Enhanced logging
    console.log('=== doGet called ===');
    console.log('Parameters:', JSON.stringify(e ? e.parameter : 'no params'));
    console.log('Query string:', e ? e.queryString : 'no query string');
    
    // Add CORS headers for all responses
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    };
    
    // Handle preflight OPTIONS request
    if (e && e.parameter && e.parameter.method === 'OPTIONS') {
      console.log('Handling OPTIONS preflight request');
      return createJsonResponse({message: 'CORS preflight OK'}, headers);
    }
    
    // Handle case when no parameters
    if (!e || !e.parameter) {
      console.log('No parameters provided, returning basic info');
      return createJsonResponse({
        status: 'API is running',
        timestamp: new Date().toISOString(),
        message: 'Provide sheet parameter to get data'
      }, headers);
    }
    
    const sheet = e.parameter.sheet;
    const action = e.parameter.action;
    
    console.log('Sheet:', sheet);
    console.log('Action:', action);
    
    if (!sheet) {
      console.log('Missing sheet parameter');
      return createJsonResponse({error: 'Missing sheet parameter'}, headers);
    }
    
    // Handle save action
    if (action === 'save') {
      console.log('=== SAVE ACTION ===');
      
      // Extract data from parameters
      const data = {};
      for (const key in e.parameter) {
        if (key !== 'sheet' && key !== 'action') {
          data[key] = e.parameter[key];
        }
      }
      
      console.log('Data to save:', JSON.stringify(data));
      
      if (Object.keys(data).length === 0) {
        console.log('No data to save');
        return createJsonResponse({error: 'No data provided to save'}, headers);
      }
      
      const result = saveToSheet(sheet, data);
      console.log('Save result:', result);
      
      return createJsonResponse({
        success: true,
        message: 'Data saved successfully',
        data: data
      }, headers);
    }
    
    // Default: get data
    console.log('=== GET DATA ACTION ===');
    const data = getSheetData(sheet);
    console.log('Retrieved', data.length, 'records from', sheet);
    
    return createJsonResponse(data, headers);
      
  } catch (error) {
    console.log('=== ERROR in doGet ===');
    console.log('Error:', error.toString());
    console.log('Stack:', error.stack);
    
    return createJsonResponse({
      error: error.toString(),
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
}

function doPost(e) {
  try {
    console.log('=== doPost called ===');
    console.log('Post data:', e ? e.postData : 'no post data');
    
    // For simplicity, redirect to doGet with parsed parameters
    if (e && e.postData && e.postData.contents) {
      try {
        const jsonData = JSON.parse(e.postData.contents);
        console.log('Parsed JSON data:', jsonData);
        
        // Convert JSON to parameter format
        const fakeEvent = {
          parameter: jsonData,
          queryString: ''
        };
        
        return doGet(fakeEvent);
        
      } catch (parseError) {
        console.log('JSON parse error:', parseError.toString());
        return createJsonResponse({
          error: 'Invalid JSON in POST body: ' + parseError.toString()
        });
      }
    }
    
    // If no POST data, treat as GET
    return doGet(e);
    
  } catch (error) {
    console.log('=== ERROR in doPost ===');
    console.log('Error:', error.toString());
    
    return createJsonResponse({
      error: error.toString(),
      timestamp: new Date().toISOString()
    });
  }
}

function createJsonResponse(data, headers = {}) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  
  // Add CORS headers
  const defaultHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
  
  const allHeaders = { ...defaultHeaders, ...headers };
  
  // Note: Google Apps Script doesn't support setting custom headers in ContentService
  // CORS is handled automatically for deployed web apps
  
  return output;
}

function getSheetData(sheetName) {
  try {
    console.log('=== getSheetData ===');
    console.log('Getting data from sheet:', sheetName);
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      throw new Error('No active spreadsheet found. Make sure this script is bound to a Google Sheets file.');
    }
    
    console.log('Spreadsheet found:', ss.getName());
    
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
    console.log('Last row:', lastRow);
    
    if (lastRow <= 1) {
      console.log('No data found in sheet (only headers or empty)');
      return [];
    }
    
    const lastCol = sheet.getLastColumn();
    console.log('Last column:', lastCol);
    
    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    console.log('Headers:', headers.join(', '));
    
    const dataRange = sheet.getRange(2, 1, lastRow - 1, lastCol);
    const data = dataRange.getValues();
    console.log('Data rows retrieved:', data.length);
    
    // Convert to array of objects
    const result = data.map((row, index) => {
      const obj = {};
      headers.forEach((header, headerIndex) => {
        obj[header] = row[headerIndex];
      });
      return obj;
    });
    
    console.log('Converted to objects:', result.length);
    return result;
    
  } catch (error) {
    console.log('=== ERROR in getSheetData ===');
    console.log('Error:', error.toString());
    throw error;
  }
}

function saveToSheet(sheetName, data) {
  try {
    console.log('=== saveToSheet ===');
    console.log('Saving to sheet:', sheetName);
    console.log('Data:', JSON.stringify(data));
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      throw new Error('No active spreadsheet found');
    }
    
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
    
    // Get current headers
    const lastCol = Math.max(sheet.getLastColumn(), 1);
    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    console.log('Current headers:', headers.join(', '));
    
    // If no headers exist, create them from data keys
    if (headers.length === 0 || !headers[0]) {
      const dataKeys = Object.keys(data);
      sheet.getRange(1, 1, 1, dataKeys.length).setValues([dataKeys]);
      console.log('Created new headers:', dataKeys.join(', '));
      
      // Update headers array
      headers.length = 0;
      headers.push(...dataKeys);
    }
    
    // Prepare row data
    const rowData = headers.map(header => {
      const value = data[header];
      return value !== undefined && value !== null ? value : '';
    });
    
    console.log('Row data:', rowData.join(' | '));
    
    // Add data to next row
    const nextRow = sheet.getLastRow() + 1;
    console.log('Adding to row:', nextRow);
    
    sheet.getRange(nextRow, 1, 1, rowData.length).setValues([rowData]);
    
    console.log('Data saved successfully to row:', nextRow);
    return true;
    
  } catch (error) {
    console.log('=== ERROR in saveToSheet ===');
    console.log('Error:', error.toString());
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

// Test functions for debugging
function testGetData() {
  console.log('=== Testing getData ===');
  try {
    const result = getSheetData('TrainingPlans');
    console.log('Test result:', result);
    return result;
  } catch (error) {
    console.log('Test error:', error.toString());
    return { error: error.toString() };
  }
}

function testSaveData() {
  console.log('=== Testing saveData ===');
  try {
    const testData = {
      PlanID: 999,
      UserID: 1,
      Name: 'API Test Plan',
      Description: 'Created via API test',
      DifficultyLevel: 'Beginner',
      DurationWeeks: 1
    };
    
    const result = saveToSheet('TrainingPlans', testData);
    console.log('Save test result:', result);
    return result;
  } catch (error) {
    console.log('Save test error:', error.toString());
    return { error: error.toString() };
  }
}
