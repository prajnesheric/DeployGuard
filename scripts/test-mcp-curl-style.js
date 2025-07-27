// Test script for Datadog MCP connection using the exact same pattern as in route.ts
require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

async function testDatadogMCPConnection() {
  console.log('Testing Datadog MCP connection with exact code from route.ts...');
  
  // Get MCP server configuration and credentials from environment variables
  let serverUrl = process.env.DATADOG_MCP_SERVER_URL || 'https://mcp.datadoghq.com/api/unstable/mcp-server/mcp';
  const apiKey = process.env.DATADOG_API_KEY;
  const appKey = process.env.DATADOG_APP_KEY;
  
  // Check for required authentication credentials
  if (!apiKey) {
    throw new Error('Datadog API key not found. Please add DATADOG_API_KEY to your .env.local file.');
  }
  
  if (!appKey) {
    throw new Error('Datadog Application key not found. Please add DATADOG_APP_KEY to your .env.local file.');
  }

  console.log('API Key: ', apiKey.substring(0, 5) + '...');
  console.log('App Key:', appKey.substring(0, 5) + '...');
  console.log('Server URL:', serverUrl);
  
  // Connect to the real Datadog MCP server
  console.log(`[MCP] Connecting to Datadog MCP Server at ${serverUrl}...`);
  
  try {
    // Setup headers exactly as in the working curl command
    const headers = {
      'DD-API-KEY': apiKey,
      'DD-APPLICATION-KEY': appKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    console.log('[MCP] Sending request with API key and Application key...');
    console.log('[MCP] Headers:', JSON.stringify(headers).replace(apiKey, '***').replace(appKey, '***'));
    
    // Make the actual request to the MCP server using the working curl command pattern
    console.log('[MCP] Making request to:', serverUrl);
    
    // Add a timeout to the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      const mcpResponse = await fetch(serverUrl, {
        method: 'GET',
        headers: headers,
        signal: controller.signal
      });
      
      // Clear the timeout if the request completes
      clearTimeout(timeoutId);
    
    console.log('[MCP] Response status:', mcpResponse.status);
    
    if (!mcpResponse.ok) {
      const errorText = await mcpResponse.text();
      console.error(`[MCP] Error: ${mcpResponse.status} - ${errorText}`);
      throw new Error(`MCP server returned ${mcpResponse.status}: ${errorText}`);
    }
    
    // Parse the MCP server response
    try {
      const mcpData = await mcpResponse.json();
      console.log('[MCP] Connection successful! Server response:');
      console.log(JSON.stringify(mcpData, null, 2));
    } catch (parseError) {
      console.log('[MCP] Connection successful but received non-JSON response');
      const text = await mcpResponse.text();
      console.log('[MCP] Raw response:');
      console.log(text);
    }
    
    console.log('[MCP] Successfully connected to Datadog MCP server');
  } catch (error) {
    console.error('[MCP] Connection error:', error);
  }
}

// Run the test
testDatadogMCPConnection().then(() => {
  console.log('Test completed');
}).catch(error => {
  console.error('Unhandled error:', error);
});
