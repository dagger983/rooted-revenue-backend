const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcrypt");
const catalyst = require("zcatalyst-sdk-node");
const app = express();
const port = process.env.PORT || 3306;

// Middleware
app.use(bodyParser.json());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// MySQL Connection
const db = mysql.createConnection({
  host: "bain5b6uljkqvousa9i8-mysql.services.clever-cloud.com",
  user: "u0larcw41pjyvzhp",
  password: "b2axJmnk8UfG8rbCnH8u",
  database: "bain5b6uljkqvousa9i8"
});

db.connect(err => {
  if (err) {
    console.error("Database connection failed: " + err.stack);
    return;
  }
  console.log("Connected to database.");
});

// Registration API
app.post("/register", async (req, res) => {
  const { username, mobileNo, password } = req.body;

  // Check if mobileNo already exists
  db.query("SELECT * FROM users WHERE mobileNo = ?", [mobileNo], async (err, results) => {
    if (err) return res.status(500).send("Server error");
    if (results.length > 0) return res.status(400).send("Mobile number already exists");

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    db.query("INSERT INTO users (username, mobileNo, password) VALUES (?, ?, ?)", [username, mobileNo, hashedPassword], (err, results) => {
      if (err) return res.status(500).send("Server error");
      res.status(201).send("User registered successfully");
    });
  });
});

// Login API
app.post("/login", (req, res) => {
  const { mobileNo, password } = req.body;

  // Check if mobileNo exists
  db.query("SELECT * FROM users WHERE mobileNo = ?", [mobileNo], async (err, results) => {
    if (err) return res.status(500).send("Server error");
    if (results.length === 0) return res.status(400).send("Mobile number not found");

    const user = results[0];

    // Compare password
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).send("Invalid password");

   
    res.send("Login successful"); 
  });
});

// Example route
app.get("/", (req, res) => {
  res.send("Server is running!");
});

// Start server
const listenPort = process.env.X_ZOHO_CATALYST_LISTEN_PORT || port;

app.listen(listenPort, () => {
  console.log(`Server running on port ${listenPort}`);
});
