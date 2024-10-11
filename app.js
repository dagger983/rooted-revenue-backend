const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcrypt");


const app = express();
const port = process.env.PORT || 3306;

// Middleware
app.use(bodyParser.json());
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

// MySQL Connection Pool
const pool = mysql.createPool({
  connectionLimit: 10,
  host:"bain5b6uljkqvousa9i8-mysql.services.clever-cloud.com",
  user:"u0larcw41pjyvzhp",
  password: "b2axJmnk8UfG8rbCnH8u",
  database: "bain5b6uljkqvousa9i8",
});

// Registration Endpoint
app.post("/register", async (req, res) => {
  const { username, mobileNo, password } = req.body;

  try {
    pool.query("SELECT * FROM users WHERE mobileNo = ?", [mobileNo], async (err, results) => {
      if (err) {
        console.error("Database query error: ", err);
        return res.status(500).json({ message: "Server error during database query.", error: err });
      }
      if (results.length > 0) {
        return res.status(400).json({ message: "Mobile number already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      pool.query("INSERT INTO users (username, mobileNo, password) VALUES (?, ?, ?)", 
        [username, mobileNo, hashedPassword], (err) => {
          if (err) {
            console.error("Error inserting user: ", err);
            return res.status(500).json({ message: "Server error during user registration.", error: err });
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

// Login Endpoint
app.post("/login", async (req, res) => {
  const { mobileNo, password } = req.body;

  if (!mobileNo || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  pool.query("SELECT * FROM users WHERE mobileNo = ?", [mobileNo], async (err, results) => {
    if (err) {
      console.error("Database query error: ", err);
      return res.status(500).json({ message: "Server error" });
    }

    if (results.length === 0) {
      return res.status(400).json({ message: "Mobile number not found" });
    }

    const user = results[0];

    try {
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(400).json({ message: "Invalid password" });
      }

      res.json({ message: "Login successful" });
    } catch (error) {
      console.error("Error comparing passwords: ", error);
      return res.status(500).json({ message: "Error comparing passwords" });
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
