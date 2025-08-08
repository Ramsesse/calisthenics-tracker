// === ENHANCED GOOGLE APPS SCRIPT WITH JSONP SUPPORT ===
// This version supports both regular requests and JSONP to bypass CORS

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
    const callback = e.parameter.callback; // For JSONP support
    
    if (!sheet) {
      Logger.log('Missing sheet parameter');
      const response = {error: 'Missing sheet parameter'};
      return createResponse(response, callback);
    }
    
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
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  } else {
    // Regular JSON response
    Logger.log('Creating JSON response');
    return ContentService
      .createTextOutput(jsonString)
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Get data from specified sheet
function getSheetData(sheetName) {
  try {
    Logger.log('Getting data from sheet: ' + sheetName);
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      Logger.log('Sheet not found: ' + sheetName);
      throw new Error(`Sheet '${sheetName}' not found`);
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

// Save data to specified sheet
function saveToSheet(sheetName, data) {
  try {
    Logger.log('Saving to sheet: ' + sheetName);
    Logger.log('Data to save: ' + JSON.stringify(data));
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
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

// Test function with comprehensive checking
function testSetup() {
  Logger.log('=== COMPREHENSIVE APPS SCRIPT TEST ===');
  
  // Test 1: Check if spreadsheet is accessible
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    Logger.log('✅ Spreadsheet accessible: ' + ss.getName());
    Logger.log('📊 Spreadsheet ID: ' + ss.getId());
  } catch (e) {
    Logger.log('❌ Spreadsheet error: ' + e.toString());
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
  
  // Test 3: Test creating and reading from a test sheet
  try {
    const testResult = saveToSheet('TestSheet', {
      name: 'Test User',
      timestamp: new Date().toISOString(),
      test: 'API Test'
    });
    Logger.log('✅ Save test result: ' + testResult);
  } catch (e) {
    Logger.log('❌ Save test error: ' + e.toString());
  }
  
  // Test 4: Test reading the test sheet
  try {
    const testData = getSheetData('TestSheet');
    Logger.log('✅ Read test result: ' + testData.length + ' records');
    Logger.log('📄 Test data: ' + JSON.stringify(testData));
  } catch (e) {
    Logger.log('❌ Read test error: ' + e.toString());
  }
  
  // Test 5: Test JSONP response creation
  try {
    const jsonpResponse = createResponse({test: 'data'}, 'testCallback');
    Logger.log('✅ JSONP response test successful');
  } catch (e) {
    Logger.log('❌ JSONP response error: ' + e.toString());
  }
  
  Logger.log('=== TEST COMPLETE ===');
  Logger.log('Next steps:');
  Logger.log('1. Deploy as web app with "Anyone" access');
  Logger.log('2. Test with: YOUR_URL?sheet=TestSheet');
  Logger.log('3. Test JSONP with: YOUR_URL?sheet=TestSheet&callback=myCallback');
}
