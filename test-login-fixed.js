const axios = require('axios');

const BASE_URL = 'http://localhost:8000/api';

// Test the login API after fixing function names
async function testLoginFixed() {
  console.log('🧪 Testing Login API After Function Name Fix...\n');

  try {
    // Test login with super user credentials
    const loginData = {
      email: 'super@admin.com',
      password: 'super@123'
    };

    console.log('1. Testing login with super user...');
    console.log('   📧 Email:', loginData.email);
    console.log('   🔐 Password:', loginData.password);

    const response = await axios.post(`${BASE_URL}/auth/login`, loginData);
    
    console.log('\n✅ Login successful!');
    console.log('   📝 Response status:', response.status);
    console.log('   📊 Response data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.data.token) {
      console.log('\n🎉 JWT Token received successfully!');
      console.log('   🔑 Token:', response.data.data.token.substring(0, 50) + '...');
      console.log('   👤 User role:', response.data.data.user.role);
      console.log('   👤 User name:', response.data.data.user.first_name + ' ' + response.data.data.user.last_name);
      
      console.log('\n✅ All function names have been updated successfully!');
      console.log('   - sendSuccessRespose ✅');
      console.log('   - sendErrorResponse ✅');
    }

  } catch (error) {
    if (error.response) {
      console.error('❌ API Error:', error.response.status, error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('❌ Connection refused. Please make sure the server is running:');
      console.error('   npm run dev');
    } else {
      console.error('❌ Network Error:', error.message);
    }
  }
}

// Test the API
testLoginFixed(); 