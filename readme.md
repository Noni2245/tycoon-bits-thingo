# Bits Tycoon

A simple idle tycoon game built with HTML, CSS, JavaScript, and Node.js/Express for server-side saving, authentication, and shop unlocks.

## Features

- **Clicker Gameplay:** Click to earn "bits" and buy upgrades.
- **Upgrades:** Buy upgrades to increase bits per click and passive bit generation.
- **Shop:** Spend bits in a shop (with unlockable content).
- **Account System:** Register/login with a username & password (stored in a JSON file for demo purposes).
- **Save/Load:** Progress is automatically saved locally and can be saved/loaded to/from the server.
- **Unlockable Secret Page:** Buy an item in the shop to unlock a hidden page (`secret.html`). Access is protected server-side.
- **Responsive & Polished UI:** Colorful, animated, and mobile-friendly.

## Getting Started

### Requirements

- [Node.js](https://nodejs.org/) (v14+ recommended)
- npm (comes with Node.js)

### Installation

1. **Clone or download this repo.**

2. **Install dependencies:**
   ```sh
   npm install express cookie-parser
   ```

3. **Run the server:**
   ```sh
   node server.js
   ```
   The server will run at `http://localhost:3000`.

4. **Open in your browser:**
   ```
   http://localhost:3000
   ```

### File Structure

```
- server.js          # Node.js/Express server (handles auth, save/load, shop, secret page access)
- index.html         # Main Tycoon game page
- secret.html        # Unlockable secret page (shop item 1 unlocks this)
- style.css          # Game and site styling
- game.js            # Client-side game logic
- users.json         # User login data (created on first run)
- saves.json         # Player save data (created on first run)
- sessions.json      # Session tokens (created on first run)
```

### How to Play

1. **Register an account** or login.
2. **Click the button** to earn bits.
3. **Buy upgrades** to automate and accelerate your progress.
4. **Open the Shop** and buy the "Secret Page" unlock for 100,000 bits.
5. **Click the new button** in the Shop to visit the secret page!

### Security Notes

- For demonstration only: Passwords are stored in plaintext. **Do not use for real authentication.**
- Sessions use a simple token via cookies.
- Shop and secret page unlocks are protected server-side.



## License

MIT License