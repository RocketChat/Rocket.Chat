require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose'); // Import Mongoose
const app = express();

app.use(express.json());


const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/onboarding_db';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error(' MongoDB Connection Error:', err.message);
    console.log(' Make sure MongoDB is running or set MONGODB_URI environment variable');
  });

 

const UserSchema = new mongoose.Schema({
  username: String,
  step: { type: Number, default: 0 },
  department: String,
  employeeId: String,
  location: String
});


const User = mongoose.model('User', UserSchema);


app.post('/webhook', async (req, res) => {
  const username = req.body.user_name;
  const msg = req.body.text ? req.body.text.trim().toLowerCase() : "";

  // Find the user in the DB, or create them if they don't exist
  let user = await User.findOne({ username: username });

  if (!user) {
    user = new User({ username: username, step: 0 });
    await user.save();
  }

  console.log(`User: ${username} | Step: ${user.step} | Msg: ${msg}`);

  
  if (msg.includes('help')) {
    return res.json({ text: "🤖 I can help. Ask about 'documents' or 'HR'." });
  }

  if (user.step === 0) {
    if (msg === 'onboarding') {
      user.step = 1;
      await user.save(); 
      return res.json({ text: "👋 Welcome! **Which department are you joining?**" });
    }
    return res.json({ text: `Hi ${username}! Type **'onboarding'** to start.` });
  }

  
  if (user.step === 1) {
    user.department = msg;
    user.step = 2;
    await user.save(); 
    return res.json({ text: `Got it. **What is your Employee ID?**` });
  }

  
  if (user.step === 2) {
    user.employeeId = msg;
    user.step = 3;
    await user.save(); 
    return res.json({ text: "Thanks. **Which city is your work location?**" });
  }

  
  if (user.step === 3) {
    user.location = msg;
    user.step = 4;
    await user.save(); // Save final step

    return res.json({ text: ` **Done!**\nDept: ${user.department}\nID: ${user.employeeId}\nLoc: ${user.location}` });
  }

  
  if (user.step === 4) {
    return res.json({ text: "You have already completed onboarding." });
  }

  return res.json({ text: "I didn't understand that." });
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Bot running on port ${PORT}`);
});
