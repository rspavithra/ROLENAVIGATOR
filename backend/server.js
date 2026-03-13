
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = 5000;

/* ==============================
   MIDDLEWARE
============================== */
app.use(express.json());
app.use(cors());

/* ==============================
   CONNECT TO MONGODB
============================== */

mongoose.connect(
  "mongodb+srv://rsp4160_db_user:TU7stsm1NDCbn0JO@cluster0.whvqigo.mongodb.net/rolenavigator"
)
.then(() => console.log("MongoDB Connected Successfully ✅"))
.catch((err) => console.log("MongoDB Connection Error ❌", err));

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
   ROOT ROUTE
============================== */
app.get("/", (req, res) => {
  res.send("RoleNavigator Backend Running 🚀");
});

/* ==============================
   FORCE TEST ROUTE (FOR DEBUG)
============================== */
app.get("/force", async (req, res) => {
  try {
    const testUser = new User({
      name: "Test User",
      email: "test@test.com",
      password: "123456"
    });

    await testUser.save();
    res.send("User saved successfully!");
  } catch (error) {
    res.status(500).send("Error saving user");
  }
});

/* ==============================
   SIGNUP ROUTE
============================== */
app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      message: "All fields are required"
    });
  }

  try {
    const newUser = new User({ name, email, password });
    await newUser.save();

    res.status(200).json({
      message: "User saved to database successfully 🎉"
    });
  } catch (error) {
    res.status(500).json({
      message: "Error saving user",
      error
    });
  }
});

/* ==============================
   START SERVER
============================== */
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});