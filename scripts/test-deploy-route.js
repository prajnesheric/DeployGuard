// Test script to verify the API route is working with Datadog integration
require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

async function testDeployRoute() {
  console.log('Testing the deploy route with Datadog MCP integration...');
  
  try {
    console.log('Connecting to the /api/deploy endpoint...');
    
    // We need to use EventSource for server-sent events
    const EventSource = require('eventsource');
    const eventSource = new EventSource('http://localhost:3000/api/deploy');
    
    console.log('EventSource connected, waiting for events...');
    
    // Set up event handlers
    eventSource.onopen = () => {
      console.log('✅ Connection to deploy route opened');
    };
    
    eventSource.onerror = (error) => {
      console.error('❌ EventSource error:', error);
      eventSource.close();
    };
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📬 Event received:', JSON.stringify(data, null, 2));
        
        // If we get a final event, close the connection
        if (data.type === 'step_completed' && data.step === 'Initiate Continuous Monitoring') {
          console.log('✅ Workflow completed successfully!');
          eventSource.close();
        }
      } catch (e) {
        console.error('Error parsing event data:', e);
      }
    };
    
    // Close connection after timeout (20 seconds)
    setTimeout(() => {
      console.log('⏱️ Timeout reached, closing connection');
      eventSource.close();
    }, 20000);
    
    // Wait for the connection to close
    await new Promise(resolve => {
      eventSource.addEventListener('close', resolve);
      // Also resolve after timeout
      setTimeout(resolve, 21000);
    });
    
  } catch (error) {
    console.error('Error testing deploy route:', error);
  }
}

// Execute the test
console.log('⚠️ Make sure the Next.js development server is running on port 3000!');
console.log('Start it with: npm run dev\n');
console.log('Press Ctrl+C to cancel if the server is not running.');
setTimeout(() => {
  testDeployRoute().finally(() => {
    console.log('\n🏁 Test completed');
  });
}, 3000); // Give user time to read the message
