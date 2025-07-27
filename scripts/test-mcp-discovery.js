// Test script for Datadog MCP protocol discovery
require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

async function testDatadogMCPDiscovery() {
  console.log('Testing Datadog MCP discovery protocol...');
  
  // Get credentials
  const apiKey = process.env.DATADOG_API_KEY;
  const appKey = process.env.DATADOG_APP_KEY;
  
  if (!apiKey || !appKey) {
    throw new Error('Datadog API key or App key not found in .env.local');
  }
  
  // Standard headers for all requests
  const headers = {
    'DD-API-KEY': apiKey,
    'DD-APPLICATION-KEY': appKey,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  
  // Test discovery endpoint
  const baseUrl = 'https://mcp.datadoghq.com/api/unstable/mcp-server';
  
  // Try various discovery endpoints
  const endpoints = [
    `${baseUrl}/mcp/v1/discovery`,
    `${baseUrl}/mcp/discovery`,
    `${baseUrl}/discovery`,
    `${baseUrl}/v1/discovery`
  ];
  
  for (const endpoint of endpoints) {
    console.log(`\n[MCP] Trying discovery endpoint: ${endpoint}`);
    
    try {
      const response = await fetch(endpoint, {
        method: 'GET', // Discovery is typically a GET request
        headers: headers
      });
      
      console.log(`[MCP] Response status: ${response.status}`);
      
      if (response.ok) {
        try {
          const data = await response.json();
          console.log('[MCP] Discovery successful! Response:');
          console.log(JSON.stringify(data, null, 2));
          return data; // Return successful data
        } catch (e) {
          const text = await response.text();
          console.log('[MCP] Response (text):', text || '(empty)');
        }
      } else {
        try {
          const errorText = await response.text();
          console.error(`[MCP] Error ${response.status}:`, errorText || '(empty response)');
        } catch (e) {
          console.error(`[MCP] Error ${response.status}, could not read response`);
        }
      }
    } catch (error) {
      console.error(`[MCP] Request failed:`, error.message);
    }
  }
  
  // If discovery fails, try to follow the MCP protocol manually
  console.log('\n[MCP] Discovery failed, trying to create a session...');
  
  try {
    // Step 1: Create a session
    console.log('[MCP] Creating a new session...');
    
    const sessionResponse = await fetch(`${baseUrl}/mcp/session`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        client_id: 'deployguard-test-client'
      })
    });
    
    console.log(`[MCP] Session creation status: ${sessionResponse.status}`);
    
    if (sessionResponse.ok) {
      const sessionData = await sessionResponse.json();
      console.log('[MCP] Session created:', sessionData);
      
      // Extract session ID
      const sessionId = sessionData.session_id;
      
      if (!sessionId) {
        console.error('[MCP] No session ID in response');
        return;
      }
      
      // Step 2: Use the session to interact with MCP
      console.log(`[MCP] Using session ${sessionId} to query monitors...`);
      
      const monitorsResponse = await fetch(`${baseUrl}/mcp/monitors`, {
        method: 'GET',
        headers: {
          ...headers,
          'X-MCP-Session-ID': sessionId
        }
      });
      
      console.log(`[MCP] Monitors query status: ${monitorsResponse.status}`);
      
      if (monitorsResponse.ok) {
        const monitorsData = await monitorsResponse.json();
        console.log('[MCP] Monitors found:', JSON.stringify(monitorsData, null, 2));
      } else {
        console.error(`[MCP] Failed to get monitors: ${await monitorsResponse.text() || '(empty response)'}`);
      }
    } else {
      console.error(`[MCP] Failed to create session: ${await sessionResponse.text() || '(empty response)'}`);
    }
  } catch (error) {
    console.error('[MCP] Session protocol failed:', error.message);
  }
  
  console.log('\n[MCP] Test completed');
}

// Run the test
testDatadogMCPDiscovery().catch(error => {
  console.error('Unhandled error:', error);
});
