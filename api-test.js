// Simple API test file for GitHub Pages
console.log("Testing API connection...");

const testApiUrl = "https://script.google.com/macros/s/AKfycbwiDlSFZIVr5m9B98GXuXpXOEd43Cn4tY4Ug6MNWGB4ebMHTJDPxlVmda9ModBrNT06/exec";

async function testConnection() {
  try {
    console.log("Attempting to fetch from API...");
    const response = await fetch(`${testApiUrl}?sheet=Equipment`);
    console.log("Response received:", response.status);
    const data = await response.json();
    console.log("Data:", data);
    
    document.body.innerHTML = `
      <h1>API Test Result</h1>
      <p>Status: ${response.status}</p>
      <p>Data: ${JSON.stringify(data, null, 2)}</p>
    `;
  } catch (error) {
    console.error("API Error:", error);
    document.body.innerHTML = `
      <h1>API Test Failed</h1>
      <p>Error: ${error.message}</p>
      <p>This likely means CORS is not properly configured in Google Apps Script.</p>
    `;
  }
}

document.addEventListener('DOMContentLoaded', testConnection);
