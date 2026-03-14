
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

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
    console.log("MongoDB Connection Error ❌", err);
    console.log("Continuing in fallback mode (in-memory storage)");
  });

/* ==============================
   USER SCHEMA
============================== */

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String
});

const User = mongoose.model("User", userSchema);

/* ==============================
   SERVE FRONTEND
============================== */
app.use(express.static(CLIENT_ROOT));

app.get(["/", "/signup", "/login"], (req, res) => {
  // SPA routes should return the frontend entrypoint
  res.sendFile(path.join(CLIENT_ROOT, "index.html"));
});

/* ==============================
   FORCE TEST ROUTE (FOR DEBUG)
============================== */
app.get("/force", async (req, res) => {
  try {
    if (dbConnected) {
      const testUser = new User({
        name: "Test User",
        email: "test@test.com",
        password: "123456"
      });

      await testUser.save();
      return res.send("User saved successfully!");
    }

    // Fallback: store in memory if DB is unavailable
    fallbackUsers.push({
      name: "Test User",
      email: "test@test.com",
      password: "123456"
    });
    res.send("User saved to in-memory fallback storage (no DB connection).");
  } catch (error) {
    console.error("/force save error", error);
    res.status(500).send("Error saving user");
  }
});

/* ==============================
   SIGNUP ROUTE
============================== */
app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  console.log("/signup request", { name, email, password: password ? "<redacted>" : null, dbConnected });

  if (!name || !email || !password) {
    return res.status(400).json({
      message: "All fields are required"
    });
  }

  try {
    if (dbConnected) {
      const newUser = new User({ name, email, password });
      await newUser.save();

      console.log("Signup saved to MongoDB", { email });
      return res.status(200).json({
        message: "User saved to database successfully 🎉"
      });
    }

    // Fallback: store in memory if DB is unavailable
    fallbackUsers.push({ name, email, password });
    console.log("Signup stored in fallback memory", { email });

    res.status(200).json({
      message: "User saved in memory (DB not connected)."
    });
  } catch (error) {
    console.error("Signup error", error);
    res.status(500).json({
      message: "Error saving user",
      error: error.message || error
    });
  }
});

/* ==============================
   START SERVER
============================== */
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});