// API Test for GitHub Pages deployment
const testApiUrl = "https://script.google.com/macros/s/AKfycbwiDlSFZIVr5m9B98GXuXpXOEd43Cn4tY4Ug6MNWGB4ebMHTJDPxlVmda9ModBrNT06/exec";

async function testConnection() {
  const statusDiv = document.getElementById('status');
  const resultsDiv = document.getElementById('results');
  
  try {
    statusDiv.innerHTML = '⏳ Testing GET request to Equipment sheet...';
    statusDiv.className = 'testing';
    
    console.log("Testing API connection to:", testApiUrl);
    const response = await fetch(`${testApiUrl}?sheet=Equipment`);
    console.log("Response status:", response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log("Data received:", data);
      
      statusDiv.innerHTML = '✅ API Connection Successful!';
      statusDiv.className = 'success';
      
      resultsDiv.innerHTML = `
        <h3>📊 Test Results:</h3>
        <p><strong>Status:</strong> ${response.status} ${response.statusText}</p>
        <p><strong>Equipment records:</strong> ${Array.isArray(data) ? data.length : 'Invalid format'}</p>
        <h4>Raw Response:</h4>
        <pre>${JSON.stringify(data, null, 2)}</pre>
        
        <h3>🧪 Testing POST request...</h3>
        <div id="post-test">Testing...</div>
      `;
      
      // Test POST request
      await testPostRequest();
      
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
  } catch (error) {
    console.error("API Error:", error);
    statusDiv.innerHTML = '❌ API Connection Failed';
    statusDiv.className = 'error';
    
    resultsDiv.innerHTML = `
      <h3>❌ Error Details:</h3>
      <p><strong>Error:</strong> ${error.message}</p>
      <p><strong>Likely causes:</strong></p>
      <ul>
        <li>CORS not properly configured in Google Apps Script</li>
        <li>Apps Script not deployed as web app</li>
        <li>Apps Script execution permissions not set to "Anyone"</li>
        <li>Network connectivity issues</li>
      </ul>
      
      <h4>🔧 CORS Setup Instructions:</h4>
      <p>Make sure your Google Apps Script includes these functions:</p>
      <pre>
function doOptions() {
  return ContentService
    .createTextOutput()
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
}

function doGet(e) {
  // Your existing doGet code
  const response = ContentService.createTextOutput()
    .setMimeType(ContentService.MimeType.JSON)
    .setContent(JSON.stringify(data));
    
  response.setHeaders({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  
  return response;
}
      </pre>
    `;
  }
}

async function testPostRequest() {
  const postTestDiv = document.getElementById('post-test');
  
  try {
    const testData = {
      UserId: "test-user",
      Date: new Date().toISOString().split("T")[0],
      Exercise: "API-Test",
      Reps: "1"
    };
    
    const response = await fetch(`${testApiUrl}?sheet=BaseTest`, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(testData)
    });
    
    if (response.ok) {
      postTestDiv.innerHTML = '✅ POST request successful! App is ready to use.';
      postTestDiv.className = 'success';
    } else {
      throw new Error(`POST failed: ${response.status}`);
    }
    
  } catch (error) {
    postTestDiv.innerHTML = `❌ POST request failed: ${error.message}`;
    postTestDiv.className = 'error';
  }
}

document.addEventListener('DOMContentLoaded', testConnection);
