// Test script for Datadog MCP connection with POST method
require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

async function testDatadogMCPConnection() {
  console.log('Testing Datadog MCP connection with POST method...');
  
  // Get MCP server configuration and credentials from environment variables
  let serverUrl = process.env.DATADOG_MCP_SERVER_URL || 'https://mcp.datadoghq.com/api/unstable/mcp-server/mcp';
  const apiKey = process.env.DATADOG_API_KEY;
  const appKey = process.env.DATADOG_APP_KEY;
  
  // Check for required authentication credentials
  if (!apiKey || !appKey) {
    throw new Error('Datadog API key or App key not found in .env.local');
  }

  console.log('API Key: ', apiKey.substring(0, 5) + '...');
  console.log('App Key:', appKey.substring(0, 5) + '...');
  console.log('Server URL:', serverUrl);
  
  // Try different HTTP methods
  const methods = ['POST', 'GET', 'PUT'];
  
  for (const method of methods) {
    console.log(`\n[MCP] Trying ${method} request to ${serverUrl}...`);
    
    try {
      // Setup headers exactly as in the working curl command
      const headers = {
        'DD-API-KEY': apiKey,
        'DD-APPLICATION-KEY': appKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      // Request options
      const options = {
        method: method,
        headers: headers
      };
      
      // Add empty body for POST/PUT requests
      if (method === 'POST' || method === 'PUT') {
        options.body = JSON.stringify({});
      }
      
      // Make the request
      console.log(`[MCP] Making ${method} request with headers:`, 
                 JSON.stringify(headers).replace(apiKey, '***').replace(appKey, '***'));
      
      const response = await fetch(serverUrl, options);
      
      console.log(`[MCP] ${method} Response status:`, response.status);
      
      if (response.ok) {
        try {
          const data = await response.json();
          console.log(`[MCP] ${method} Success! Response data:`, JSON.stringify(data, null, 2));
          break; // Exit the loop if successful
        } catch (parseError) {
          const text = await response.text();
          console.log(`[MCP] ${method} Success! Raw response:`, text || '(empty response)');
          break; // Exit the loop if successful
        }
      } else {
        let errorText;
        try {
          errorText = await response.text();
        } catch (e) {
          errorText = '(could not read response body)';
        }
        console.error(`[MCP] ${method} Error ${response.status}:`, errorText || '(empty response)');
      }
    } catch (error) {
      console.error(`[MCP] ${method} Request failed:`, error.message);
    }
  }
  
  console.log('\n[MCP] Test completed');
}

// Run the test
testDatadogMCPConnection().catch(error => {
  console.error('Unhandled error:', error);
});
