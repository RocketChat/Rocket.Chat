const crypto = require('crypto');
const BASE_URL = 'http://localhost:3000';
const visitorToken = crypto.randomUUID();

async function runTest() {
    console.log(`Testing with token: ${visitorToken}`);
    
    await fetch(`${BASE_URL}/api/v1/livechat/visitor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitor: { token: visitorToken } })
    });
    
    const params = new URLSearchParams({ token: visitorToken });
    const url = `${BASE_URL}/api/v1/livechat/room?${params}`;
    
    const [resA, resB] = await Promise.all([fetch(url), fetch(url)]);
    const [jsonA, jsonB] = await Promise.all([resA.json(), resB.json()]);
    
    console.log('Response A:', JSON.stringify(jsonA, null, 2));
    console.log('Response B:', JSON.stringify(jsonB, null, 2));
}

runTest();
