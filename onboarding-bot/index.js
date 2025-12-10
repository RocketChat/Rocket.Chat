const express = require('express');
const app = express();

app.use(express.json());

// In-Memory Storage
let steps = {};
let data = {};

app.post('/webhook', (req, res) => {
  const user = req.body.user_name;
  const msg = req.body.text ? req.body.text.trim().toLowerCase() : "";

  if (!steps[user]) {
    steps[user] = 0;
    data[user] = {};
  }

  console.log(`User: ${user} | Step: ${steps[user]} | Msg: ${msg}`);

  // STEP 0: Start
  if (steps[user] === 0) {
    if (msg === 'onboarding') {
      steps[user] = 1;
      return res.json({ text: "👋 Welcome! Which department are you joining?" });
    }
    return res.json({ text: `Hi ${user}! Type **'onboarding'** to begin.` });
  }

  // STEP 1: Department
  if (steps[user] === 1) {
    data[user].department = msg;
    steps[user] = 2;
    return res.json({ text: "Great! What is your Employee ID?" });
  }

  // STEP 2: Employee ID
  if (steps[user] === 2) {
    data[user].employeeId = msg;
    steps[user] = 3;
    return res.json({ text: "Thanks! Which city is your work location?" });
  }

  // STEP 3: Location
  if (steps[user] === 3) {
    data[user].location = msg;
    steps[user] = 4;

    return res.json({
      text: `
🎉 **Onboarding Complete!**
- Department: ${data[user].department}
- ID: ${data[user].employeeId}
- Location: ${data[user].location}

Type **'help'** if you have more questions!
      `
    });
  }