const express = require("express");
const fs = require("fs");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// ✅ Fixed public folder path
app.use(express.static(path.join(__dirname, "public")));

const USERS_FILE = path.join(__dirname, "users.json");

// === Helper functions ===
function readUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  const data = fs.readFileSync(USERS_FILE);
  return JSON.parse(data);
}

function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// === Routes ===

// Signup
app.post("/signup", (req, res) => {
  const { email, password } = req.body;
  const users = readUsers();

  if (users.find((u) => u.email === email)) {
    return res.json({ success: false, message: "Email already exists" });
  }

  users.push({ email, password, balance: 0, isAdmin: false });
  writeUsers(users);

  res.json({ success: true });
});

// Login
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const users = readUsers();

  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) {
    return res.json({ success: false, message: "Invalid credentials" });
  }

  res.json({ success: true, isAdmin: user.isAdmin });
});

// Get balance
app.get("/balance/:email", (req, res) => {
  const { email } = req.params;
  const users = readUsers();
  const user = users.find((u) => u.email === email);

  if (!user) return res.json({ success: false, message: "User not found" });

  res.json({ success: true, balance: user.balance });
});

// Admin: Update balance
app.post("/admin/update-balance", (req, res) => {
  const { email, amount, adminEmail } = req.body;

  const users = readUsers();
  const admin = users.find((u) => u.email === adminEmail && u.isAdmin);

  if (!admin) return res.json({ success: false, message: "Not authorized" });

  const user = users.find((u) => u.email === email);
  if (!user) return res.json({ success: false, message: "User not found" });

  user.balance = amount;
  writeUsers(users);

  res.json({ success: true, newBalance: amount });
});

// Admin: Get all users
app.get("/admin/users", (req, res) => {
  const users = readUsers();
  res.json(users);
});

// ✅ Fixed fallback route path
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
