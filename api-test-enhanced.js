// Enhanced API Test with JSONP fallback for CORS issues
const testApiUrl = "https://script.google.com/macros/s/AKfycbwiDlSFZIVr5m9B98GXuXpXOEd43Cn4tY4Ug6MNWGB4ebMHTJDPxlVmda9ModBrNT06/exec";

// Test using JSONP to bypass CORS
function testWithJSONP() {
  const statusDiv = document.getElementById('status');
  const resultsDiv = document.getElementById('results');
  
  statusDiv.innerHTML = '⏳ Testing JSONP connection (CORS bypass)...';
  statusDiv.className = 'testing';
  
  // Create callback function
  window.jsonpCallback = function(data) {
    console.log("JSONP Data received:", data);
    
    statusDiv.innerHTML = '✅ JSONP Connection Successful!';
    statusDiv.className = 'success';
    
    resultsDiv.innerHTML = `
      <h3>📊 JSONP Test Results:</h3>
      <p><strong>Status:</strong> Success via JSONP</p>
      <p><strong>Data type:</strong> ${typeof data}</p>
      <p><strong>Records:</strong> ${Array.isArray(data) ? data.length : 'Not an array'}</p>
      <h4>Raw Response:</h4>
      <pre>${JSON.stringify(data, null, 2)}</pre>
      
      <div class="info">
        <h4>✅ JSONP Working!</h4>
        <p>Your Apps Script is accessible, but CORS is blocking regular fetch requests.</p>
        <p><strong>Solution:</strong> We'll modify the app to use JSONP instead of fetch.</p>
      </div>
    `;
    
    // Clean up
    document.body.removeChild(script);
    delete window.jsonpCallback;
  };
  
  // Create script element for JSONP
  const script = document.createElement('script');
  script.src = `${testApiUrl}?sheet=Equipment&callback=jsonpCallback`;
  script.onerror = function() {
    statusDiv.innerHTML = '❌ JSONP Connection Failed';
    statusDiv.className = 'error';
    
    resultsDiv.innerHTML = `
      <h3>❌ JSONP Error:</h3>
      <p>Even JSONP failed. Check if:</p>
      <ul>
        <li>Apps Script is deployed as web app</li>
        <li>Access is set to "Anyone"</li>
        <li>URL is correct</li>
      </ul>
      
      <h4>🔧 Manual Test:</h4>
      <p>Try opening this URL in a new tab:</p>
      <a href="${testApiUrl}?sheet=Equipment" target="_blank" style="color: #58a6ff; word-break: break-all;">
        ${testApiUrl}?sheet=Equipment
      </a>
    `;
    
    document.body.removeChild(script);
    delete window.jsonpCallback;
  };
  
  document.body.appendChild(script);
}

// Original fetch test
async function testConnection() {
  const statusDiv = document.getElementById('status');
  const resultsDiv = document.getElementById('results');
  
  try {
    statusDiv.innerHTML = '⏳ Testing standard fetch request...';
    statusDiv.className = 'testing';
    
    console.log("Testing API connection to:", testApiUrl);
    const response = await fetch(`${testApiUrl}?sheet=Equipment`);
    console.log("Response status:", response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log("Data received:", data);
      
      statusDiv.innerHTML = '✅ Fetch Connection Successful!';
      statusDiv.className = 'success';
      
      resultsDiv.innerHTML = `
        <h3>📊 Fetch Test Results:</h3>
        <p><strong>Status:</strong> ${response.status} ${response.statusText}</p>
        <p><strong>Equipment records:</strong> ${Array.isArray(data) ? data.length : 'Invalid format'}</p>
        <h4>Raw Response:</h4>
        <pre>${JSON.stringify(data, null, 2)}</pre>
      `;
      
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
  } catch (error) {
    console.error("Fetch Error:", error);
    statusDiv.innerHTML = '❌ Fetch Failed - Trying JSONP...';
    statusDiv.className = 'error';
    
    // Try JSONP as fallback
    setTimeout(() => testWithJSONP(), 1000);
  }
}

// Test both methods
async function runAllTests() {
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = `
    <h3>🧪 Running Connection Tests...</h3>
    <p>Testing both standard fetch and JSONP methods...</p>
  `;
  
  // Try fetch first
  await testConnection();
}

// Enhanced manual test
function openManualTest() {
  const url = `${testApiUrl}?sheet=Equipment`;
  window.open(url, '_blank');
  
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML += `
    <div class="info">
      <h4>📝 Manual Test Instructions:</h4>
      <p>A new tab opened with your Apps Script URL. Check if:</p>
      <ul>
        <li>✅ You see JSON data (even if empty: <code>[]</code>)</li>
        <li>✅ No error messages</li>
        <li>❌ If you see error - check deployment settings</li>
      </ul>
    </div>
  `;
}
