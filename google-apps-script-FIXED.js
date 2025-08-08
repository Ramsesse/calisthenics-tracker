// === FIXED GOOGLE APPS SCRIPT CODE ===
// Copy this ENTIRE code to your Google Apps Script project
// This version fixes the setHeaders error and parameter issues

function doGet(e) {
  // Add CORS headers and handle the request
  try {
    Logger.log('doGet called with parameters: ' + JSON.stringify(e));
    
    // Check if parameters exist
    if (!e || !e.parameter) {
      Logger.log('No parameters provided');
      return ContentService
        .createTextOutput(JSON.stringify({error: 'No parameters provided'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const sheet = e.parameter.sheet;
    if (!sheet) {
      Logger.log('Missing sheet parameter');
      return ContentService
        .createTextOutput(JSON.stringify({error: 'Missing sheet parameter'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    Logger.log('Getting data for sheet: ' + sheet);
    const data = getSheetData(sheet);
    
    return ContentService
      .createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('doGet Error: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    Logger.log('doPost called with parameters: ' + JSON.stringify(e));
    
    // Check if parameters exist
    if (!e || !e.parameter) {
      Logger.log('No parameters provided');
      return ContentService
        .createTextOutput(JSON.stringify({error: 'No parameters provided'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const sheet = e.parameter.sheet;
    if (!sheet) {
      Logger.log('Missing sheet parameter');
      return ContentService
        .createTextOutput(JSON.stringify({error: 'Missing sheet parameter'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    let data;
    try {
      if (e.postData && e.postData.contents) {
        data = JSON.parse(e.postData.contents);
        Logger.log('Parsed POST data: ' + JSON.stringify(data));
      } else {
        Logger.log('No POST data provided');
        return ContentService
          .createTextOutput(JSON.stringify({error: 'No POST data provided'}))
          .setMimeType(ContentService.MimeType.JSON);
      }
    } catch (parseError) {
      Logger.log('JSON parse error: ' + parseError.toString());
      return ContentService
        .createTextOutput(JSON.stringify({error: 'Invalid JSON data: ' + parseError.toString()}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const result = saveToSheet(sheet, data);
    
    return ContentService
      .createTextOutput(JSON.stringify({success: result}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('doPost Error: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({error: error.toString()}))
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

// Test function - you can run this to test your setup
function testSetup() {
  Logger.log('=== Testing Apps Script Setup ===');
  
  // Test 1: Check if spreadsheet is accessible
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    Logger.log('✅ Spreadsheet accessible: ' + ss.getName());
  } catch (e) {
    Logger.log('❌ Spreadsheet error: ' + e.toString());
    return;
  }
  
  // Test 2: Test creating a test sheet
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
  
  // Test 3: Test reading the test sheet
  try {
    const testData = getSheetData('TestSheet');
    Logger.log('✅ Read test result: ' + JSON.stringify(testData));
  } catch (e) {
    Logger.log('❌ Read test error: ' + e.toString());
  }
  
  Logger.log('=== Test Complete ===');
}
