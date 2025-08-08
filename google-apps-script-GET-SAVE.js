// === COMPLETE GOOGLE APPS SCRIPT WITH GET-BASED SAVING ===
// This version handles both data retrieval and saving via GET parameters

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
        Logger.log('Added headers: ' + headers.join(', '));
      }
    }
    
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      Logger.log('No data found in sheet');
      return [];
    }
    
    const lastCol = sheet.getLastColumn();
    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    const dataRange = sheet.getRange(2, 1, lastRow - 1, lastCol);
    const data = dataRange.getValues();
    
    Logger.log('Headers: ' + headers.join(', '));
    Logger.log('Data rows: ' + data.length);
    
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
    Logger.log('getSheetData Error: ' + error.toString());
    throw error;
  }
}

// Save data to specified sheet
function saveToSheet(sheetName, data) {
  try {
    Logger.log('Saving data to sheet: ' + sheetName);
    Logger.log('Data: ' + JSON.stringify(data));
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      throw new Error('No active spreadsheet found');
    }
    
    let sheet = ss.getSheetByName(sheetName);
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      Logger.log('Sheet not found, creating: ' + sheetName);
      sheet = ss.insertSheet(sheetName);
      
      // Add default headers
      const headers = getDefaultHeaders(sheetName);
      if (headers.length > 0) {
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        Logger.log('Added headers: ' + headers.join(', '));
      }
    }
    
    // Get headers
    const lastCol = Math.max(sheet.getLastColumn(), 1);
    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    Logger.log('Current headers: ' + headers.join(', '));
    
    // If no headers exist, create them from data keys
    if (headers.length === 0 || headers[0] === '') {
      const dataKeys = Object.keys(data);
      sheet.getRange(1, 1, 1, dataKeys.length).setValues([dataKeys]);
      Logger.log('Created new headers: ' + dataKeys.join(', '));
    }
    
    // Get updated headers after potential creation
    const currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // Prepare row data
    const rowData = currentHeaders.map(header => data[header] || '');
    Logger.log('Row data: ' + rowData.join(', '));
    
    // Add data to next row
    const nextRow = sheet.getLastRow() + 1;
    sheet.getRange(nextRow, 1, 1, rowData.length).setValues([rowData]);
    
    Logger.log('Data saved to row: ' + nextRow);
    return true;
    
  } catch (error) {
    Logger.log('saveToSheet Error: ' + error.toString());
    throw error;
  }
}

// Get default headers for different sheet types
function getDefaultHeaders(sheetName) {
  const headerMap = {
    'Users': ['id', 'username', 'email', 'created_at'],
    'BaseTest': ['id', 'user_id', 'exercise_name', 'max_reps', 'test_date'],
    'Progressions': ['id', 'user_id', 'exercise_name', 'level', 'max_reps', 'updated_at'],
    'Equipment': ['id', 'name', 'description', 'available'],
    'TrainingPlans': ['PlanID', 'UserID', 'Name', 'Description', 'DifficultyLevel', 'DurationWeeks'],
    'TrainingPlanExercises': ['PlanID', 'Day', 'ExerciseName', 'Sets', 'Reps', 'RestSeconds', 'MuscleGroup', 'EquipmentRequired'],
    'UserHistory': ['id', 'user_id', 'exercise_name', 'sets', 'reps', 'weight', 'date']
  };
  
  return headerMap[sheetName] || [];
}

// Test function to verify setup
function testFunction() {
  Logger.log('Test function called');
  return 'Google Apps Script is working!';
}
