// === FIXED GOOGLE APPS SCRIPT WITH SHEET CREATION ===
// This version creates missing sheets automatically

function doGet(e) {
  try {
    Logger.log('doGet called with parameters: ' + JSON.stringify(e ? e.parameter : 'no params'));
    
    // Handle case when no parameters (direct execution in editor)
    if (!e || !e.parameter) {
      Logger.log('No parameters provided');
      return ContentService
        .createTextOutput(JSON.stringify({error: 'No parameters provided'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const sheet = e.parameter.sheet;
    const action = e.parameter.action;
    const callback = e.parameter.callback; // For JSONP support
    
    if (!sheet) {
      Logger.log('Missing sheet parameter');
      const response = {error: 'Missing sheet parameter'};
      return createResponse(response, callback);
    }
    
    // Handle save action via GET parameters
    if (action === 'save') {
      Logger.log('Saving data via GET parameters to sheet: ' + sheet);
      
      // Extract data from parameters (exclude system parameters)
      const data = {};
      for (const key in e.parameter) {
        if (key !== 'sheet' && key !== 'action' && key !== 'callback') {
          data[key] = e.parameter[key];
        }
      }
      
      Logger.log('Data to save: ' + JSON.stringify(data));
      const result = saveToSheet(sheet, data);
      const response = {success: result, message: 'Data saved successfully'};
      return createResponse(response, callback);
    }
    
    // Default: get data
    Logger.log('Getting data for sheet: ' + sheet);
    const data = getSheetData(sheet);
    Logger.log('Data retrieved: ' + data.length + ' records');
    
    return createResponse(data, callback);
      
  } catch (error) {
    Logger.log('doGet Error: ' + error.toString());
    const response = {error: error.toString()};
    return createResponse(response, callback);
  }
}

function doPost(e) {
  try {
    Logger.log('doPost called');
    
    if (!e || !e.parameter) {
      Logger.log('No parameters provided');
      return ContentService
        .createTextOutput(JSON.stringify({error: 'No parameters provided'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const sheet = e.parameter.sheet;
    const callback = e.parameter.callback;
    
    if (!sheet) {
      Logger.log('Missing sheet parameter');
      const response = {error: 'Missing sheet parameter'};
      return createResponse(response, callback);
    }
    
    let data;
    try {
      if (e.postData && e.postData.contents) {
        data = JSON.parse(e.postData.contents);
        Logger.log('Parsed POST data: ' + JSON.stringify(data));
      } else {
        Logger.log('No POST data provided');
        const response = {error: 'No POST data provided'};
        return createResponse(response, callback);
      }
    } catch (parseError) {
      Logger.log('JSON parse error: ' + parseError.toString());
      const response = {error: 'Invalid JSON data: ' + parseError.toString()};
      return createResponse(response, callback);
    }
    
    const result = saveToSheet(sheet, data);
    const response = {success: result};
    
    return createResponse(response, callback);
      
  } catch (error) {
    Logger.log('doPost Error: ' + error.toString());
    const response = {error: error.toString()};
    return createResponse(response, callback);
  }
}

// Create response that supports both JSON and JSONP
function createResponse(data, callback) {
  const jsonString = JSON.stringify(data);
  
  if (callback) {
    // JSONP response
    Logger.log('Creating JSONP response with callback: ' + callback);
    return ContentService
      .createTextOutput(callback + '(' + jsonString + ');')
      .setMimeType(ContentService.MimeType.JSON);
  } else {
    // Regular JSON response
    Logger.log('Creating JSON response');
    return ContentService
      .createTextOutput(jsonString)
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Get data from specified sheet - creates sheet if missing
function getSheetData(sheetName) {
  try {
    Logger.log('Getting data from sheet: ' + sheetName);
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      throw new Error('No active spreadsheet found. Please open this script from a Google Sheets file.');
    }
    
    let sheet = ss.getSheetByName(sheetName);
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      Logger.log('Sheet not found, creating: ' + sheetName);
      sheet = ss.insertSheet(sheetName);
      
      // Add default headers based on sheet name
      const headers = getDefaultHeaders(sheetName);
      if (headers.length > 0) {
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        Logger.log('Added default headers: ' + JSON.stringify(headers));
      }
      
      return []; // Return empty array for new sheet
    }
    
    const data = sheet.getDataRange().getValues();
    Logger.log('Raw data rows: ' + data.length);
    
    if (data.length === 0) {
      Logger.log('Sheet is empty');
      return [];
    }
    
    if (data.length === 1) {
      Logger.log('Only headers found, no data rows');
      return [];
    }
    
    const headers = data[0];
    const rows = data.slice(1);
    
    const result = rows.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || '';
      });
      return obj;
    });
    
    Logger.log('Processed data objects: ' + result.length);
    return result;
    
  } catch (error) {
    Logger.log('getSheetData Error: ' + error.toString());
    throw error;
  }
}

// Get default headers for different sheet types
function getDefaultHeaders(sheetName) {
  const headerMap = {
    'Users': ['id', 'name', 'email', 'created_at'],
    'Equipment': ['id', 'name', 'type', 'available'],
    'TrainingPlans': ['id', 'name', 'description', 'difficulty'],
    'TrainingPlanExercises': ['id', 'plan_id', 'exercise_name', 'sets', 'reps', 'day'],
    'UserHistory': ['id', 'user_id', 'exercise_name', 'sets', 'reps', 'weight', 'date'],
    'Progressions': ['id', 'user_id', 'exercise_name', 'level', 'max_reps', 'updated_at'],
    'BaseTest': ['id', 'user_id', 'exercise_name', 'max_reps', 'test_date'],
    'TestSheet': ['name', 'timestamp', 'test']
  };
  
  return headerMap[sheetName] || ['id', 'name', 'value'];
}

// Save data to specified sheet
function saveToSheet(sheetName, data) {
  try {
    Logger.log('Saving to sheet: ' + sheetName);
    Logger.log('Data to save: ' + JSON.stringify(data));
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      throw new Error('No active spreadsheet found. Please open this script from a Google Sheets file.');
    }
    
    let sheet = ss.getSheetByName(sheetName);
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      Logger.log('Creating new sheet: ' + sheetName);
      sheet = ss.insertSheet(sheetName);
    }
    
    // If sheet is empty, add headers
    if (sheet.getLastRow() === 0 && data && Object.keys(data).length > 0) {
      const headers = Object.keys(data);
      Logger.log('Adding headers: ' + JSON.stringify(headers));
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
    
    // Add data row
    if (data && Object.keys(data).length > 0) {
      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      const row = headers.map(header => data[header] || '');
      
      const nextRow = sheet.getLastRow() + 1;
      Logger.log('Adding data to row: ' + nextRow);
      sheet.getRange(nextRow, 1, 1, row.length).setValues([row]);
      
      return true;
    }
    
    Logger.log('No data to save');
    return false;
    
  } catch (error) {
    Logger.log('saveToSheet Error: ' + error.toString());
    throw error;
  }
}

// Initialize all required sheets with default data
function initializeAllSheets() {
  Logger.log('=== INITIALIZING ALL SHEETS ===');
  
  const requiredSheets = [
    'Users', 'Equipment', 'TrainingPlans', 'TrainingPlanExercises', 
    'UserHistory', 'Progressions', 'BaseTest'
  ];
  
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    Logger.log('Working with spreadsheet: ' + ss.getName());
    
    requiredSheets.forEach(sheetName => {
      try {
        const data = getSheetData(sheetName); // This will create sheet if missing
        Logger.log(`✅ ${sheetName}: ${data.length} records`);
      } catch (e) {
        Logger.log(`❌ Error with ${sheetName}: ${e.toString()}`);
      }
    });
    
    // Add some sample equipment data
    try {
      const equipmentData = [
        {id: '1', name: 'Pull-up bar', type: 'strength', available: 'true'},
        {id: '2', name: 'Parallel bars', type: 'strength', available: 'true'},
        {id: '3', name: 'Resistance bands', type: 'strength', available: 'true'}
      ];
      
      equipmentData.forEach(item => {
        saveToSheet('Equipment', item);
      });
      
      Logger.log('✅ Added sample equipment data');
    } catch (e) {
      Logger.log('❌ Error adding equipment data: ' + e.toString());
    }
    
  } catch (error) {
    Logger.log('❌ Initialization error: ' + error.toString());
  }
  
  Logger.log('=== INITIALIZATION COMPLETE ===');
}

// Test function with comprehensive checking
function testSetup() {
  Logger.log('=== COMPREHENSIVE APPS SCRIPT TEST ===');
  
  // Test 1: Check if spreadsheet is accessible
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    Logger.log('✅ Spreadsheet accessible: ' + ss.getName());
    Logger.log('📊 Spreadsheet ID: ' + ss.getId());
    Logger.log('🔗 Spreadsheet URL: ' + ss.getUrl());
  } catch (e) {
    Logger.log('❌ Spreadsheet error: ' + e.toString());
    Logger.log('💡 Solution: Open this Apps Script from a Google Sheets file, not standalone');
    return;
  }
  
  // Test 2: List existing sheets
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheets = ss.getSheets();
    Logger.log('📋 Available sheets: ' + sheets.map(s => s.getName()).join(', '));
  } catch (e) {
    Logger.log('❌ Sheet listing error: ' + e.toString());
  }
  
  // Test 3: Initialize all required sheets
  try {
    initializeAllSheets();
  } catch (e) {
    Logger.log('❌ Initialization error: ' + e.toString());
  }
  
  // Test 4: Test reading from Equipment sheet
  try {
    const equipmentData = getSheetData('Equipment');
    Logger.log('✅ Equipment read test: ' + equipmentData.length + ' records');
    Logger.log('📄 Equipment data: ' + JSON.stringify(equipmentData));
  } catch (e) {
    Logger.log('❌ Equipment read error: ' + e.toString());
  }
  
  Logger.log('=== TEST COMPLETE ===');
  Logger.log('🎯 Next steps:');
  Logger.log('1. If test passed, deploy as web app');
  Logger.log('2. Set access to "Anyone"');
  Logger.log('3. Test with browser: YOUR_URL?sheet=Equipment');
}
