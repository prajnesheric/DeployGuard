// Test script to verify connection to Datadog MCP server
// Run with: node scripts/test-datadog-mcp.js
require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

async function testDatadogConnection() {
  console.log('Testing connection to Datadog MCP server...');
  
  // Get credentials from environment variables
  const serverUrl = process.env.DATADOG_MCP_SERVER_URL;
  const username = process.env.DATADOG_USERNAME;
  const password = process.env.DATADOG_PASSWORD;
  const apiKey = process.env.DATADOG_API_KEY;
  
  if (!serverUrl) {
    console.error('❌ ERROR: DATADOG_MCP_SERVER_URL not found in .env.local');
    return;
  }
  
  console.log(`🔍 MCP Server URL: ${serverUrl}`);
  
  if (!username || !password) {
    console.warn('⚠️ WARNING: Username or password not found. Using API key only.');
  } else {
    console.log(`👤 Username: ${username}`);
    console.log(`🔑 Password: ${'*'.repeat(password.length)}`);
  }
  
  if (!apiKey) {
    console.warn('⚠️ WARNING: API key not found. Authentication may fail.');
  } else {
    console.log(`🔑 API Key: ${apiKey.substring(0, 5)}${'*'.repeat(apiKey.length - 5)}`);
  }
  
  // Create authentication headers
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (username && password) {
    const base64Auth = Buffer.from(`${username}:${password}`).toString('base64');
    headers['Authorization'] = `Basic ${base64Auth}`;
    console.log('🔐 Using username/password authentication');
  }
  
  if (apiKey) {
    headers['DD-API-KEY'] = apiKey;
    console.log('🔐 Using API key authentication');
  }

  // Try multiple endpoints and methods
  await testAPIValidation(apiKey);
  await testMCPConnection(serverUrl, headers);
  await testMCPServerStatus(serverUrl, headers);
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

async function testMCPConnection(serverUrl, headers) {
  console.log('\n📡 Testing MCP server connection...');
  
  try {
    // Try both with and without /mcp suffix
    const baseUrl = serverUrl.endsWith('/mcp') 
      ? serverUrl.slice(0, -4) 
      : serverUrl;
    
    const response = await fetch(baseUrl, {
      method: 'GET',
      headers: headers
    });
    
    console.log(`📊 MCP Base URL Status: ${response.status}`);
    
    if (response.ok) {
      console.log('✅ Connection to MCP server base URL successful!');
      try {
        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
      } catch (e) {
        const text = await response.text();
        console.log(text.substring(0, 1000) + (text.length > 1000 ? '...' : ''));
      }
    } else {
      console.log('❌ Connection to MCP server base URL failed');
      console.log(`Response: ${await response.text()}`);
    }
  } catch (error) {
    console.error(`❌ Error connecting to MCP server base URL: ${error.message}`);
  }
}

async function testMCPServerStatus(serverUrl, headers) {
  console.log('\n📡 Testing MCP server status endpoint...');
  
  try {
    // Try the specific MCP endpoint
    const response = await fetch(serverUrl, {
      method: 'GET',
      headers: headers
    });
    
    console.log(`📊 MCP Status: ${response.status}`);
    
    if (response.ok) {
      console.log('✅ Connection to MCP server endpoint successful!');
      try {
        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
      } catch (e) {
        const text = await response.text();
        console.log(text.substring(0, 1000) + (text.length > 1000 ? '...' : ''));
      }
    } else {
      console.log('❌ Connection to MCP server endpoint failed');
      console.log(`Response: ${await response.text()}`);
    }
  } catch (error) {
    console.error(`❌ Error connecting to MCP server endpoint: ${error.message}`);
  }
}

// Execute the test
testDatadogConnection().catch(error => {
  console.error('Unhandled error in test script:', error);
});
