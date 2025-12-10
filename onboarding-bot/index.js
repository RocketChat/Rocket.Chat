const express = require('express');
const app = express();

app.use(express.json());

// ---  WORK STARTS HERE ---


// 'steps' remembers which question the user is currently on.
// 'data' stores the answers the user gives.
let steps = {};  
let data = {};   

app.post('/webhook', (req, res) => {
  // 2. Extract data from Rocket.Chat's webhook request
  const user = req.body.user_name;
  const msg = req.body.text ? req.body.text.trim().toLowerCase() : "";

  // 3. Initialize user if they are new
  if (!steps[user]) {
    steps[user] = 0;
    data[user] = {};
  }

  console.log(`User: ${user} | Step: ${steps[user]} | Msg: ${msg}`);

  // 4. STEP 0: Waiting for the user to say "onboarding"
  if (steps[user] === 0) {
    if (msg === 'onboarding') {
      steps[user] = 1; // Move to next step
      return res.json({ text: "👋 Welcome! Let's get you set up.\n\nFirst question: **Which department are you joining?**" });
    } else {
      // Fallback if they haven't started yet
      return res.json({ text: `Hi ${user}! I am your onboarding assistant. Type **'onboarding'** to start.` });
    }
  }

  // 5. STEP 1: User just answered Department
  if (steps[user] === 1) {
    data[user].department = msg; // Save answer
    steps[user] = 2; // Move to next step
    return res.json({ text: `Got it, ${msg} department.\n\nNext: **What is your Employee ID?**` });
  }

  // 6. STEP 2: User just answered Employee ID
  if (steps[user] === 2) {
    data[user].employeeId = msg;
    steps[user] = 3;
    return res.json({ text: "Thanks. \n\nLast question: **Which city is your work location?**" });
  }

  // 7. STEP 3: User just answered Location
  if (steps[user] === 3) {
    data[user].location = msg;
    steps[user] = 4; // Mark as complete
    
    // Summary message
    const summary = `
      🎉 **Onboarding Complete!**
      - Department: ${data[user].department}
      - ID: ${data[user].employeeId}
      - Location: ${data[user].location}
      
      You can now type **'help'** if you have questions.
    `;
    return res.json({ text: summary });
  }

  // 8. STEP 4: Completed State
  if (steps[user] === 4) {
    return res.json({ text: "You have already completed onboarding! Type 'help' for other queries." });
  }
  
  return res.json({ text: "I didn't understand that." });
});

// --- YOUR WORK ENDS HERE ---

// Note: Ensure this port matches what Person A set up (3000 or 3001)
const PORT = 3000; 
app.listen(PORT, () => {
  console.log(`Onboarding bot running on port ${PORT}`);
});