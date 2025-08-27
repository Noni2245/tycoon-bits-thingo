// Bits Tycoon Game Logic with shop secret unlock

let bits = 0;
let bitsPerClick = 1;
let shopUnlocks = [false, false, false, false];
let upgrades = [
    {
        name: "Better Mouse",
        description: () => `Increase bits per click by 1 <span class="upgrade-plus">(+${upgrades[0]?.level || 0} clicks)</span>`,
        baseCost: 10,
        level: 0,
        cost: 10,
        effect() {
            bitsPerClick += 1;
        }
    },
    {
        name: "Auto Clicker",
        description: () => `Automatically gain 1 bit per second <span class="upgrade-plus">(+${upgrades[1]?.level || 0} bits/sec)</span>`,
        baseCost: 50,
        level: 0,
        cost: 50,
        effect() {
            if (!this.interval) {
                this.interval = setInterval(() => {
                    bits += 1;
                    updateBits();
                    updateBitsVisual();
                }, 1000);
            }
        }
    },
    {
        name: "Bit Farm",
        description: () => `Automatically gain 5 bits per second <span class="upgrade-plus">(+${(upgrades[2]?.level || 0) * 5} bits/sec)</span>`,
        baseCost: 200,
        level: 0,
        cost: 200,
        effect() {
            if (!this.interval) {
                this.interval = setInterval(() => {
                    bits += 5;
                    updateBits();
                    updateBitsVisual();
                }, 1000);
            }
        }
    }
];

let username = '';
let password = '';

function showAuthPanel() {
    document.getElementById('auth-panel').style.display = '';
    document.getElementById('game-panel').style.display = 'none';
}
function showGamePanel() {
    document.getElementById('auth-panel').style.display = 'none';
    document.getElementById('game-panel').style.display = '';
}

function updateBits() {
    document.getElementById('bits').textContent = bits;
    document.getElementById('bits-visual-amount').textContent = bits;
    updateBitsVisual();
}

function renderUpgrades() {
    const upgradesDiv = document.getElementById('upgrades');
    upgradesDiv.innerHTML = '';
    upgrades.forEach((upgrade, idx) => {
        const div = document.createElement('div');
        div.className = 'upgrade';
        div.innerHTML = `
            <div class="upgrade-title">${upgrade.name} (Lv. ${upgrade.level})</div>
            <div>${typeof upgrade.description === 'function' ? upgrade.description() : upgrade.description}</div>
            <div class="upgrade-cost">Cost: ${upgrade.cost} bits</div>
            <button id="upgrade-btn-${idx}" ${bits < upgrade.cost ? 'disabled' : ''}>Buy</button>
        `;
        upgradesDiv.appendChild(div);

        document.getElementById(`upgrade-btn-${idx}`).onclick = () => {
            if (bits >= upgrade.cost) {
                bits -= upgrade.cost;
                upgrade.level++;
                upgrade.cost = Math.floor(upgrade.baseCost * Math.pow(1.7, upgrade.level));
                upgrade.effect();
                updateBits();
                renderUpgrades();
            }
        };
    });
}

// Bits Visual Meter
function updateBitsVisual() {
    const tube = document.getElementById('bits-tube-inner');
    const minFill = 0.06;
    let percent;
    if (bits <= 0) {
        percent = minFill;
    } else {
        percent = Math.log10(bits + 1) / 4;
        percent = Math.max(minFill, Math.min(percent, 0.97));
    }
    tube.style.height = `${Math.floor(percent * 100)}%`;
}

// Floating Bits Animation
function spawnFloatingBit() {
    const floatingBits = document.getElementById('floating-bits');
    const bitEl = document.createElement('div');
    bitEl.className = 'floating-bit';
    bitEl.innerText = '+1';
    bitEl.style.left = (Math.random() * 60 + 20) + 'vw';
    bitEl.style.top = (Math.random() * 40 + 50) + 'vh';
    bitEl.style.fontSize = (Math.random() * 0.8 + 1.1) + 'em';
    floatingBits.appendChild(bitEl);
    setTimeout(() => floatingBits.removeChild(bitEl), 5000);
}

function saveGameLocal() {
    localStorage.setItem('bits', bits);
    localStorage.setItem('bitsPerClick', bitsPerClick);
    localStorage.setItem('upgrades', JSON.stringify(upgrades.map(u => ({level: u.level, cost: u.cost}))));
    localStorage.setItem('shopUnlocks', JSON.stringify(shopUnlocks));
}

function loadGameLocal() {
    const savedBits = localStorage.getItem('bits');
    const savedBPC = localStorage.getItem('bitsPerClick');
    const savedUpgrades = JSON.parse(localStorage.getItem('upgrades') || 'null');
    const savedShop = JSON.parse(localStorage.getItem('shopUnlocks') || '[false,false,false,false]');
    if (savedBits) bits = parseInt(savedBits, 10);
    if (savedBPC) bitsPerClick = parseInt(savedBPC, 10);
    if (savedUpgrades) {
        savedUpgrades.forEach((su, i) => {
            upgrades[i].level = su.level;
            upgrades[i].cost = su.cost;
            if (upgrades[i].name === "Auto Clicker" && su.level > 0) upgrades[i].effect();
            if (upgrades[i].name === "Bit Farm" && su.level > 0) upgrades[i].effect();
            if (upgrades[i].name === "Better Mouse" && su.level > 0) bitsPerClick = 1 + su.level;
        });
    }
    if (savedShop) shopUnlocks = savedShop;
    updateBits();
    renderUpgrades();
    renderShopButtons();
}

document.getElementById('login-btn').onclick = async () => {
    username = document.getElementById('username').value;
    password = document.getElementById('password').value;
    const res = await fetch('/api/login', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({username, password})
    });
    if (res.ok) {
        showGamePanel();
        loadGameLocal();
        document.getElementById('auth-message').textContent = '';
    } else {
        document.getElementById('auth-message').textContent = 'Login failed!';
    }
};
document.getElementById('register-btn').onclick = async () => {
    username = document.getElementById('username').value;
    password = document.getElementById('password').value;
    const res = await fetch('/api/register', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({username, password})
    });
    if (res.ok) {
        document.getElementById('auth-message').textContent = 'Registered! Now log in.';
    } else {
        document.getElementById('auth-message').textContent = 'Register failed!';
    }
};

document.getElementById('save-server-btn').onclick = async () => {
    if (!username || !password) return;
    const saveData = {
        bits, bitsPerClick,
        upgrades: upgrades.map(u => ({level:u.level, cost:u.cost})),
        shop: shopUnlocks
    };
    const res = await fetch('/api/save', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({username, password, saveData})
    });
    if (res.ok) alert('Saved to server!');
    else alert('Failed to save!');
};

document.getElementById('load-server-btn').onclick = async () => {
    if (!username || !password) return;
    const res = await fetch('/api/load', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({username, password})
    });
    if (res.ok) {
        const { saveData } = await res.json();
        if (saveData) {
            bits = saveData.bits;
            bitsPerClick = saveData.bitsPerClick;
            (saveData.upgrades || []).forEach((u, i) => {
                upgrades[i].level = u.level;
                upgrades[i].cost = u.cost;
                if (upgrades[i].name === "Auto Clicker" && u.level > 0) upgrades[i].effect();
                if (upgrades[i].name === "Bit Farm" && u.level > 0) upgrades[i].effect();
                if (upgrades[i].name === "Better Mouse" && u.level > 0) bitsPerClick = 1 + u.level;
            });
            shopUnlocks = saveData.shop || [false,false,false,false];
            updateBits();
            renderUpgrades();
            renderShopButtons();
            saveGameLocal();
            alert('Loaded from server!');
        } else {
            alert('No save found!');
        }
    } else {
        alert('Failed to load!');
    }
};

document.getElementById('clicker').onclick = () => {
    bits += bitsPerClick;
    updateBits();
    renderUpgrades();
    spawnFloatingBit();
    saveGameLocal();
};

// Shop Modal Logic
const shopModal = document.getElementById('shop-modal');
const shopBtn = document.getElementById('shop-btn');
const shopClose = document.getElementById('shop-close');
shopBtn.onclick = () => {
    shopModal.classList.add('show');
    renderShopButtons();
};
shopClose.onclick = () => {
    shopModal.classList.remove('show');
};
window.onclick = (e) => {
    if (e.target === shopModal) shopModal.classList.remove('show');
};

// Shop buttons: buy logic and unlock secret.html
function renderShopButtons() {
    // Button 1 - secret unlock
    const btn1 = document.getElementById('shop-secret');
    if (shopUnlocks[0]) {
        btn1.disabled = false;
        btn1.classList.add('unlocked');
        btn1.classList.remove('buyable');
        btn1.style.cursor = "pointer";
        btn1.innerHTML = `<span>🎉 Secret Page Unlocked!<br><span class="shop-price" style="color:#fff;">Click to visit!</span></span>`;
        btn1.onclick = async function() {
            // Save before redirect with 0.5ms delay (actually next tick)
            await saveProgressToServer();
            setTimeout(() => {
                window.location = "/secret.html";
            }, 0.5);
        };
    } else if (bits >= 100000) {
        btn1.disabled = false;
        btn1.classList.add('buyable');
        btn1.classList.remove('unlocked');
        btn1.style.cursor = "pointer";
        btn1.innerHTML = `<span>Unlock Secret Page<br><span class="shop-price">100,000 bits</span></span>`;
        btn1.onclick = async function() {
            // Send buy request to server
            const resp = await fetch('/api/shop-buy', {
                method: 'POST',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify({itemIndex: 0})
            });
            if (resp.ok) {
                const data = await resp.json();
                if (data.success) {
                    bits = data.bits;
                    shopUnlocks = data.shop;
                    updateBits();
                    renderShopButtons();
                    saveGameLocal();
                    alert("You unlocked a secret! Click the button again to visit the page.");
                }
            }
        };
    } else {
        btn1.disabled = true;
        btn1.classList.remove('buyable', 'unlocked');
        btn1.style.cursor = "default";
        btn1.innerHTML = `<span>Unlock Secret Page<br><span class="shop-price">100,000 bits</span></span>`;
        btn1.onclick = null;
    }
}

async function saveProgressToServer() {
    if (!username || !password) return;
    const saveData = {
        bits, bitsPerClick,
        upgrades: upgrades.map(u => ({level:u.level, cost:u.cost})),
        shop: shopUnlocks
    };
    await fetch('/api/save', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({username, password, saveData})
    });
}

window.onload = () => {
    showAuthPanel();
};

setInterval(saveGameLocal, 2000);