// Final test script for Datadog MCP server connection
require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

async function testDatadogMCP() {
  console.log('Testing Datadog MCP connection with documented endpoints...');
  
  // Get credentials from environment variables
  const apiKey = process.env.DATADOG_API_KEY;
  const appKey = process.env.DATADOG_APP_KEY;
  
  if (!apiKey || !appKey) {
    console.error('❌ ERROR: API key or App key not found in .env.local');
    return;
  }
  
  console.log(`🔑 API Key: ${apiKey.substring(0, 5)}${'*'.repeat(apiKey.length - 5)}`);
  console.log(`🔑 App Key: ${appKey.substring(0, 5)}${'*'.repeat(appKey.length - 5)}`);
  
  // Standard headers for all requests
  const headers = {
    'DD-API-KEY': apiKey,
    'DD-APPLICATION-KEY': appKey,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  
  // Test correct MCP endpoints from documentation
  const endpoints = [
    // MCP v1 endpoints
    'https://api.datadoghq.com/api/v1/mcp/discovery',
    'https://api.datadoghq.com/api/v1/model-monitoring/mcp/discovery',
    'https://api.datadoghq.com/api/v1/mcp-server/discovery',
    
    // MCP v2 endpoints
    'https://api.datadoghq.com/api/v2/mcp/discovery',
    'https://api.datadoghq.com/api/v2/model-monitoring/mcp/discovery',
    'https://api.datadoghq.com/api/v2/mcp-server/discovery',
    
    // Original URL endpoint
    process.env.DATADOG_MCP_SERVER_URL
  ];
  
  for (const endpoint of endpoints) {
    await testEndpoint(endpoint, headers);
  }
  
  // Also try to list monitors
  await testMonitors(headers);
  
  console.log('\n🏁 Test completed');
}

async function testEndpoint(endpoint, headers) {
  console.log(`\n📡 Trying endpoint: ${endpoint}`);
  
  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: headers
    });
    
    console.log(`📊 Status: ${response.status}`);
    
    if (response.ok) {
      console.log('✅ Connection successful!');
      try {
        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
      } catch (e) {
        const text = await response.text();
        console.log('Text response:', text.substring(0, 500) + (text.length > 500 ? '...' : ''));
      }
    } else {
      console.log('❌ Connection failed');
      try {
        const errorText = await response.text();
        console.log(`Response: ${errorText}`);
      } catch (e) {
        console.log('Could not read error response');
      }
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }
}

async function testMonitors(headers) {
  console.log('\n📡 Trying to list monitors (may contain MCP monitors)...');
  
  try {
    const response = await fetch('https://api.datadoghq.com/api/v1/monitor', {
      method: 'GET',
      headers: headers
    });
    
    console.log(`📊 Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Successfully retrieved monitors!');
      console.log(`Found ${data.length} monitors`);
      
      // Look for any monitors that might be related to MCP
      const mcpMonitors = data.filter(monitor => 
        monitor.name.toLowerCase().includes('mcp') || 
        monitor.message.toLowerCase().includes('mcp') ||
        monitor.name.toLowerCase().includes('model') ||
        monitor.message.toLowerCase().includes('model')
      );
      
      if (mcpMonitors.length > 0) {
        console.log(`Found ${mcpMonitors.length} monitors related to models or MCP:`);
        mcpMonitors.forEach(monitor => {
          console.log(`- ${monitor.id}: ${monitor.name}`);
        });
      } else {
        console.log('No MCP-related monitors found');
      }
    } else {
      console.log('❌ Failed to list monitors');
      console.log(`Response: ${await response.text()}`);
    }
  } catch (error) {
    console.error(`❌ Error listing monitors: ${error.message}`);
  }
}

// Execute the test
testDatadogMCP().catch(error => {
  console.error('Unhandled error in test script:', error);
});
