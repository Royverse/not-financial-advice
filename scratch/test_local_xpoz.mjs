import axios from 'axios';

async function testLocal() {
  try {
    const res = await axios.post('http://localhost:8888/api/xpoz', { query: 'AAPL' });
    console.log('Success:', res.data);
  } catch (err) {
    console.error('Error:', err.response?.status, err.response?.data || err.message);
  }
}

testLocal();
