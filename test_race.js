const crypto = require('crypto');
const BASE_URL = 'http://localhost:3000';

const visitorToken = crypto.randomUUID();

async function runTest() {
    console.log(`Testing with token: ${visitorToken}`);
    
    // Register visitor
    await fetch(`${BASE_URL}/api/v1/livechat/visitor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitor: { token: visitorToken } })
    });
    
    // Concurrent requests
    const params = new URLSearchParams({ token: visitorToken });
    const url = `${BASE_URL}/api/v1/livechat/room?${params}`;
    
    const [resA, resB] = await Promise.all([fetch(url), fetch(url)]);
    const [jsonA, jsonB] = await Promise.all([resA.json(), resB.json()]);
    
    const roomA = jsonA?.room?._id;
    const roomB = jsonB?.room?._id;
    
    console.log(`Room A: ${roomA}`);
    console.log(`Room B: ${roomB}`);
    console.log(roomA === roomB ? '✅ FIXED!' : '🚨 STILL BROKEN');
}

runTest();
