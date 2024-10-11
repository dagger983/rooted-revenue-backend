const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv"); // For environment variables

dotenv.config(); // Load environment variables

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
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect(err => {
  if (err) {
    console.error("Database connection failed: " + err.stack);
    return;
  }
  console.log("Connected to database.");
});

// Registration API
// Improved Registration API
app.post("/register", async (req, res) => {
  const { username, mobileNo, password } = req.body;

  try {
    // Check if mobileNo already exists
    db.query("SELECT * FROM users WHERE mobileNo = ?", [mobileNo], async (err, results) => {
      if (err) {
        console.error("Database query error: ", err);
        return res.status(500).json({ message: "Server error during database query." });
      }
      if (results.length > 0) {
        return res.status(400).json({ message: "Mobile number already exists" });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert new user
      db.query("INSERT INTO users (username, mobileNo, password) VALUES (?, ?, ?)", 
        [username, mobileNo, hashedPassword], (err) => {
          if (err) {
            console.error("Error inserting user: ", err);
            return res.status(500).json({ message: "Server error during user registration." });
          }
          res.status(201).json({ message: "User registered successfully" });
        }
      );
    });
  } catch (error) {
    console.error("Unexpected error: ", error);
    res.status(500).json({ message: "Unexpected server error." });
  }
});


// Login API
app.post("/login", async (req, res) => {
  const { mobileNo, password } = req.body;

  // Basic validation
  if (!mobileNo || !password) {
    return res.status(400).send("All fields are required");
  }

  // Check if mobileNo exists
  db.query("SELECT * FROM users WHERE mobileNo = ?", [mobileNo], async (err, results) => {
    if (err) return res.status(500).send("Server error");
    if (results.length === 0) return res.status(400).send("Mobile number not found");

    const user = results[0];

    try {
      // Compare password
      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.status(400).send("Invalid password");

      res.send("Login successful");
    } catch (error) {
      res.status(500).send("Error comparing passwords");
    }
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
