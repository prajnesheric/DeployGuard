// Test script for Datadog API and MCP connection
// Using API Key + Application Key
require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

async function testDatadogConnection() {
  console.log('Testing Datadog API and MCP connection...');
  
  // Get credentials from environment variables
  const serverUrl = process.env.DATADOG_MCP_SERVER_URL;
  const apiKey = process.env.DATADOG_API_KEY;
  const appKey = process.env.DATADOG_APP_KEY;
  
  if (!apiKey) {
    console.error('❌ ERROR: DATADOG_API_KEY not found in .env.local');
    return;
  }
  
  if (!appKey) {
    console.error('❌ ERROR: DATADOG_APP_KEY not found in .env.local');
    return;
  }
  
  console.log(`🔍 MCP Server URL: ${serverUrl}`);
  console.log(`🔑 API Key: ${apiKey.substring(0, 5)}${'*'.repeat(apiKey.length - 5)}`);
  console.log(`🔑 App Key: ${appKey.substring(0, 5)}${'*'.repeat(appKey.length - 5)}`);
  
  // Test API key validation first
  await testAPIValidation(apiKey);
  
  // Test with both keys
  await testAPIWithBothKeys(apiKey, appKey);
  
  // Test MCP specific endpoints
  await testMCPEndpoints(serverUrl, apiKey, appKey);
}

async function testAPIValidation(apiKey) {
  console.log('\n📡 Testing API key validation...');
  const validationUrl = 'https://api.datadoghq.com/api/v1/validate';
  
  try {
    const response = await fetch(validationUrl, {
      method: 'GET',
      headers: {
        'DD-API-KEY': apiKey
      }
    });
    
    console.log(`📊 API Validation Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Key is valid!');
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log('❌ API Key validation failed');
      console.log(`Response: ${await response.text()}`);
    }
  } catch (error) {
    console.error(`❌ Error during API validation: ${error.message}`);
  }
}

async function testAPIWithBothKeys(apiKey, appKey) {
  console.log('\n📡 Testing API with both API Key and App Key...');
  const dashboardsUrl = 'https://api.datadoghq.com/api/v1/dashboard';
  
  try {
    const response = await fetch(dashboardsUrl, {
      method: 'GET',
      headers: {
        'DD-API-KEY': apiKey,
        'DD-APPLICATION-KEY': appKey,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📊 API Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API request with both keys successful!');
      // Just show the count to avoid massive output
      console.log(`Found ${data.dashboards?.length || 0} dashboards`);
    } else {
      console.log('❌ API request failed');
      console.log(`Response: ${await response.text()}`);
    }
  } catch (error) {
    console.error(`❌ Error during API request: ${error.message}`);
  }
}

async function testMCPEndpoints(serverUrl, apiKey, appKey) {
  console.log('\n📡 Testing MCP endpoints...');
  
  if (!serverUrl) {
    console.error('❌ ERROR: MCP Server URL not provided');
    return;
  }
  
  const headers = {
    'DD-API-KEY': apiKey,
    'DD-APPLICATION-KEY': appKey,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  
  // Test multiple endpoint variations
  const baseUrl = serverUrl.endsWith('/mcp') ? serverUrl.slice(0, -4) : serverUrl;
  
  const endpoints = [
    `${serverUrl}`,
    `${baseUrl}`,
    `${baseUrl}/v1/discovery`,
    `${serverUrl}/v1/discovery`,
    'https://api.datadoghq.com/api/v2/mcp-server/mcp/v1/discovery'
  ];
  
  for (const endpoint of endpoints) {
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
        console.log(`Response: ${await response.text()}`);
      }
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
  }
}

// Execute the test
testDatadogConnection().catch(error => {
  console.error('Unhandled error in test script:', error);
}).finally(() => {
  console.log('\n🏁 Test completed');
});
