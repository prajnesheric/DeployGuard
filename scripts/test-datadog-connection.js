// Test script to verify connection to Datadog MCP server
// Run with: node scripts/test-datadog-connection.js
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
  
  try {
    console.log('\n📡 Attempting to connect to Datadog MCP server...');
    
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
    
    // Try multiple endpoint variations
    const endpoints = [
      originalUrl, // Original URL from env variable
      originalUrl.endsWith('/mcp') ? originalUrl.slice(0, -4) : originalUrl, // Without /mcp suffix
      'https://api.datadoghq.com/api/v1/validate', // API validation endpoint
    ];
    
    let successfulResponse = null;
    
    for (const endpoint of endpoints) {
      console.log(`\n📡 Trying endpoint: ${endpoint}`);
      try {
        // Make a request to the endpoint
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: headers,
        });
        
        console.log(`📊 Status code: ${response.status}`);
        
        if (response.ok) {
          console.log(`✅ SUCCESS: Connection to ${endpoint} successful!`);
          successfulResponse = { endpoint, response: response.clone() };
          break;
        } else {
          console.log(`❌ Failed to connect to ${endpoint}`);
          console.log(`Response: ${await response.text()}`);
        }
      } catch (fetchError) {
        console.log(`❌ Error connecting to ${endpoint}: ${fetchError.message}`);
      }
    }
    
    if (successfulResponse) {
      const { endpoint, response } = successfulResponse;
    
    if (response.ok) {
      console.log('✅ SUCCESS: Connection to Datadog MCP server successful!');
      
      // Try to parse the response as JSON
      try {
        const data = await response.json();
        console.log('\n📦 Server response:');
        console.log(JSON.stringify(data, null, 2));
      } catch (parseError) {
        const text = await response.text();
        console.log('\n📦 Server response (text):');
        console.log(text);
      }
    } else {
      console.error('❌ ERROR: Failed to connect to Datadog MCP server');
      console.error(`Response: ${await response.text()}`);
    }
  } catch (error) {
    console.error('❌ ERROR: Exception while connecting to Datadog MCP server');
    console.error(error);
  }
}

testDatadogConnection().catch(error => {
  console.error('Unhandled error in test script:', error);
});
