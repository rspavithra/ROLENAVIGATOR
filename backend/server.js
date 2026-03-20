const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// index.html / style.css / script.js are one level up from backend/
const CLIENT_ROOT = path.join(__dirname, "..");

/* ==============================
   MIDDLEWARE
============================== */
app.use(express.json());
app.use(cors());

/* ==============================
   CONNECT TO MONGODB
============================== */
let dbConnected = false;
let fallbackUsers = [];

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    dbConnected = true;
    console.log("MongoDB Connected Successfully ✅");
  })
  .catch((err) => {
    dbConnected = false;
    console.warn("MongoDB Connection Error ❌", err.message);
    console.log("Continuing in fallback (in-memory) mode");
  });

/* ==============================
   USER SCHEMA
============================== */
const userSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

/* ==============================
   SERVE STATIC FRONTEND FILES
============================== */
app.use(express.static(CLIENT_ROOT));

/* ==============================
   API ROUTES  (MUST come BEFORE the catch-all)
============================== */

// ── SIGNUP ──────────────────────────────────────────────
app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  console.log("/signup →", { name, email, dbConnected });

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    if (dbConnected) {
      // Check for duplicate email
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(409).json({ message: "An account with this email already exists." });
      }

      const newUser = new User({ name, email, password });
      await newUser.save();
      console.log("Signup saved to MongoDB ✅", { email });
      return res.status(201).json({ message: "Account created successfully! 🎉", name });
    }

    // Fallback: in-memory
    const alreadyExists = fallbackUsers.find(u => u.email === email);
    if (alreadyExists) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }
    fallbackUsers.push({ name, email, password });
    console.log("Signup stored in memory (no DB) ✅", { email });
    return res.status(201).json({ message: "Account created (offline mode).", name });

  } catch (err) {
    console.error("Signup error", err);
    return res.status(500).json({ message: "Server error. Please try again.", error: err.message });
  }
});

// ── LOGIN ────────────────────────────────────────────────
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  console.log("/login →", { email, dbConnected });

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    if (dbConnected) {
      // Find by email first, then compare password
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "No account found with this email." });
      }
      if (user.password !== password) {
        return res.status(401).json({ message: "Incorrect password." });
      }
      console.log("Login success ✅", { email });
      return res.status(200).json({ message: "Login successful!", name: user.name });
    }

    // Fallback: in-memory
    const user = fallbackUsers.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ message: "No account found with this email." });
    }
    if (user.password !== password) {
      return res.status(401).json({ message: "Incorrect password." });
    }
    return res.status(200).json({ message: "Login successful! (offline mode)", name: user.name });

  } catch (err) {
    console.error("Login error", err);
    return res.status(500).json({ message: "Server error. Please try again.", error: err.message });
  }
});

// ── DEBUG: force-save a test user ───────────────────────
app.get("/force", async (req, res) => {
  try {
    const payload = { name: "Test User", email: "test@test.com", password: "123456" };
    if (dbConnected) {
      const u = new User(payload);
      await u.save();
      return res.send("Test user saved to MongoDB ✅");
    }
    fallbackUsers.push(payload);
    return res.send("Test user saved to memory ✅");
  } catch (err) {
    return res.status(500).send("Error: " + err.message);
  }
});

/* ==============================
   CATCH-ALL: serve index.html for any other GET route
   (MUST come AFTER all API routes)
============================== */
app.get("/{*path}", (req, res) => {
  res.sendFile(path.join(CLIENT_ROOT, "index.html"));
});

/* ==============================
   START SERVER
============================== */
app.listen(PORT, () => {
  console.log(`\n🚀 Server running at http://localhost:${PORT}\n`);
});