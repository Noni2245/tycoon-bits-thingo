const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

const USERS_FILE = path.join(__dirname, 'users.json');
const SAVES_FILE = path.join(__dirname, 'saves.json');

app.use(express.json());
app.use(express.static('.')); // Serve static files (frontend)

// --- SESSION-LIKE HANDLING ---
// Use a simple cookie for session (not secure in prod!)
const cookieParser = require('cookie-parser');
app.use(cookieParser());

const SESSION_FILE = path.join(__dirname, 'sessions.json');
function readSessions() {
    if (!fs.existsSync(SESSION_FILE)) return {};
    return JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'));
}
function writeSessions(sessions) {
    fs.writeFileSync(SESSION_FILE, JSON.stringify(sessions, null, 2));
}
function createSession(username) {
    // Simple token, not secure for prod
    const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
    const sessions = readSessions();
    sessions[token] = { username, created: Date.now() };
    writeSessions(sessions);
    return token;
}
function getSessionUsername(req) {
    const { token } = req.cookies;
    if (!token) return null;
    const sessions = readSessions();
    return sessions[token]?.username || null;
}

// Utility: read/write users
function readUsers() {
    if (!fs.existsSync(USERS_FILE)) return {};
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
}
function writeUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Utility: read/write saves
function readSaves() {
    if (!fs.existsSync(SAVES_FILE)) return {};
    return JSON.parse(fs.readFileSync(SAVES_FILE, 'utf8'));
}
function writeSaves(saves) {
    fs.writeFileSync(SAVES_FILE, JSON.stringify(saves, null, 2));
}

// Register new account
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
    const users = readUsers();
    if (users[username]) return res.status(409).json({ error: 'Username taken' });
    users[username] = { password }; // NEVER store plaintext passwords in real life
    writeUsers(users);
    res.json({ success: true });
});

// Login (now sets a token cookie)
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const users = readUsers();
    if (!users[username] || users[username].password !== password)
        return res.status(401).json({ error: 'Invalid credentials' });
    // create session token
    const token = createSession(username);
    res.cookie('token', token, { httpOnly: true });
    res.json({ success: true });
});

// Save game state
app.post('/api/save', (req, res) => {
    const username = getSessionUsername(req) || req.body.username;
    const password = req.body.password;
    const users = readUsers();
    if (!users[username] || users[username].password !== password)
        return res.status(401).json({ error: 'Auth failed' });
    const saves = readSaves();
    saves[username] = req.body.saveData;
    writeSaves(saves);
    res.json({ success: true });
});

// Load game state
app.post('/api/load', (req, res) => {
    const username = getSessionUsername(req) || req.body.username;
    const password = req.body.password;
    const users = readUsers();
    if (!users[username] || users[username].password !== password)
        return res.status(401).json({ error: 'Auth failed' });
    const saves = readSaves();
    res.json({ saveData: saves[username] || null });
});

// --- SHOP LOGIC ---
app.post('/api/shop-buy', (req, res) => {
    const username = getSessionUsername(req);
    const { itemIndex } = req.body;
    if (!username) return res.status(401).json({ error: 'Not logged in' });
    const saves = readSaves();
    const save = saves[username];
    if (!save) return res.status(400).json({ error: 'No save found' });
    // Shop items: only first item is unlock for secret.html
    const prices = [100000, 100000, 100000, 100000];
    if (itemIndex < 0 || itemIndex > 3) return res.status(400).json({ error: 'Invalid item' });
    if (save.bits < prices[itemIndex]) return res.status(400).json({ error: 'Not enough bits' });
    if (!save.shop) save.shop = [false, false, false, false];
    if (save.shop[itemIndex]) return res.status(400).json({ error: 'Already bought' });
    save.bits -= prices[itemIndex];
    save.shop[itemIndex] = true;
    saves[username] = save;
    writeSaves(saves);
    res.json({ success: true, shop: save.shop, bits: save.bits });
});

// --- Secure Secret Page Unlock API ---
app.post('/api/check-secret', (req, res) => {
    const username = getSessionUsername(req);
    if (!username) return res.json({ unlocked: false });
    const saves = readSaves();
    const save = saves[username];
    if (save && save.shop && save.shop[0]) {
        res.json({ unlocked: true });
    } else {
        res.json({ unlocked: false });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});