// Test script for Datadog MCP Server connection using standard MCP protocol
// Run with: node scripts/test-datadog-mcp-discovery.js
require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');
const EventSource = require('eventsource');

// Global variables for credentials
const serverUrl = process.env.DATADOG_MCP_SERVER_URL;
const username = process.env.DATADOG_USERNAME;
const password = process.env.DATADOG_PASSWORD;
const apiKey = process.env.DATADOG_API_KEY;

// Test MCP discovery protocol implementation
async function testMCPDiscovery() {
  console.log('🔍 Testing Datadog MCP server discovery protocol...');
  console.log(`MCP Server URL: ${serverUrl}`);
  
  // Create authentication headers
  const headers = createAuthHeaders();
  
  try {
    console.log('\n📡 Step 1: Sending discovery request to MCP server...');
    // According to MCP protocol, first step is to discover available monitors
    const discoveryEndpoint = `${serverUrl}/v1/discovery`;
    
    console.log(`Endpoint: ${discoveryEndpoint}`);
    console.log('Headers:', JSON.stringify(headers, null, 2));
    
    const response = await fetch(discoveryEndpoint, {
      method: 'GET',
      headers: headers
    });
    
    console.log(`📊 Discovery Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Discovery successful!');
      console.log(JSON.stringify(data, null, 2));
      
      // Attempt to subscribe to an event stream if discovery worked
      await testEventStream(data);
    } else {
      console.log('❌ Discovery failed');
      const errorText = await response.text();
      console.log(`Response: ${errorText}`);
      
      // Try alternate endpoint format
      await tryAlternateEndpoints();
    }
  } catch (error) {
    console.error(`❌ Error during MCP discovery: ${error.message}`);
    // Try alternate endpoint format
    await tryAlternateEndpoints();
  }
}

// Create authentication headers using available credentials
function createAuthHeaders() {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  
  if (username && password) {
    const base64Auth = Buffer.from(`${username}:${password}`).toString('base64');
    headers['Authorization'] = `Basic ${base64Auth}`;
    console.log('🔐 Using username/password authentication');
  }
  
  if (apiKey) {
    headers['DD-API-KEY'] = apiKey;
    console.log('🔐 Using API key authentication');
    
    // Datadog specific headers
    headers['DD-APPLICATION-KEY'] = process.env.DATADOG_APP_KEY || '';
  }
  
  return headers;
}

// Try different endpoint formats
async function tryAlternateEndpoints() {
  console.log('\n🔄 Trying alternate endpoint formats...');
  
  const baseUrl = serverUrl.endsWith('/mcp')
    ? serverUrl.slice(0, -4)
    : serverUrl;
  
  const alternateEndpoints = [
    `${baseUrl}/v1/discovery`,
    `${baseUrl}/discovery`,
    `${serverUrl}/discovery`,
    'https://api.datadoghq.com/api/v2/mcp-server/mcp/v1/discovery'
  ];
  
  const headers = createAuthHeaders();
  
  for (const endpoint of alternateEndpoints) {
    console.log(`\n📡 Trying endpoint: ${endpoint}`);
    
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: headers
      });
      
      console.log(`📊 Status: ${response.status}`);
      
      if (response.ok) {
        console.log('✅ Connection successful!');
        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
        return data;
      } else {
        console.log('❌ Connection failed');
        console.log(`Response: ${await response.text()}`);
      }
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
  }
  
  console.log('❌ All alternate endpoints failed');
}

// Test EventSource connection if discovery successful
async function testEventStream(discoveryData) {
  if (!discoveryData || !discoveryData.monitors || discoveryData.monitors.length === 0) {
    console.log('❌ No monitors found in discovery data');
    return;
  }
  
  console.log('\n📡 Step 2: Testing event stream connection...');
  
  // Get the first monitor for testing
  const monitor = discoveryData.monitors[0];
  console.log(`Selected monitor: ${monitor.id}`);
  
  // Construct authentication query parameters
  const authParams = new URLSearchParams();
  if (username && password) {
    authParams.append('username', username);
    authParams.append('password', password);
  }
  if (apiKey) {
    authParams.append('api_key', apiKey);
  }
  
  // Create event source URL with authentication
  const eventSourceUrl = `${serverUrl}/v1/monitors/${monitor.id}/events?${authParams}`;
  console.log(`Event stream URL: ${eventSourceUrl}`);
  
  // Connect to event stream
  try {
    console.log('Connecting to event stream (will timeout after 5 seconds)...');
    
    // Create EventSource with authentication headers
    const eventSourceHeaders = {};
    if (username && password) {
      eventSourceHeaders['Authorization'] = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
    }
    
    const eventSource = new EventSource(eventSourceUrl, { headers: eventSourceHeaders });
    
    // Set up event handlers
    eventSource.onopen = () => {
      console.log('✅ Event stream connection opened successfully');
    };
    
    eventSource.onerror = (error) => {
      console.error('❌ Event stream error:', error);
      eventSource.close();
    };
    
    eventSource.onmessage = (event) => {
      console.log('📬 Event received:', event.data);
    };
    
    // Close connection after timeout
    setTimeout(() => {
      console.log('⏱️ Closing event stream connection after timeout');
      eventSource.close();
    }, 5000);
  } catch (error) {
    console.error(`❌ Error connecting to event stream: ${error.message}`);
  }
}

// Execute the test
testMCPDiscovery().then(() => {
  console.log('\n🏁 MCP connection test completed');
}).catch(error => {
  console.error('❌ Unhandled error in test script:', error);
});
