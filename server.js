const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;
const USERS_PATH = path.join(__dirname, 'data', 'users.json');

// ── Scrape lock: only one Puppeteer at a time (prevents "browser already running")
let scrapeLock = false;
const scrapeQueue = [];

function runNextInQueue() {
  if (scrapeLock || scrapeQueue.length === 0) return;
  scrapeLock = true;
  const { userId, resolve } = scrapeQueue.shift();
  doScrape(userId)
    .then((result) => { resolve(result); scrapeLock = false; runNextInQueue(); })
    .catch((err)  => { console.error('[Queue]', err.message); resolve(null); scrapeLock = false; runNextInQueue(); });
}

function queueScrape(userId) {
  return new Promise((resolve) => {
    scrapeQueue.push({ userId, resolve });
    runNextInQueue();
  });
}

// ── Save user to data/users.json
function saveUser(userData) {
  try {
    const dir = path.dirname(USERS_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    let db = { users: [] };
    if (fs.existsSync(USERS_PATH)) {
      db = JSON.parse(fs.readFileSync(USERS_PATH, 'utf8'));
    }

    const idx = db.users.findIndex(u => u.id && u.id.toLowerCase() === userData.id.toLowerCase());
    if (idx >= 0) db.users[idx] = { ...db.users[idx], ...userData };
    else db.users.push(userData);

    fs.writeFileSync(USERS_PATH, JSON.stringify(db, null, 2), 'utf8');
    console.log(`[Cache] Saved: "${userData.id}"`);
  } catch (e) {
    console.error('[Cache] Error:', e.message);
  }
}

// ══════════════════════════════════════════════════════════════════════
//  Core scraper
// ══════════════════════════════════════════════════════════════════════
async function doScrape(userId) {
  const tempDir = path.join(os.tmpdir(), `wp-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  let browser;

  try {
    console.log(`\n[Puppeteer] Scraping ID: "${userId}"`);

    browser = await puppeteer.launch({
      headless: false,
      channel: 'chrome',
      userDataDir: tempDir,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--start-maximized',
        '--window-size=1200,800',
        '--window-position=50,50'
      ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });
    await page.bringToFront();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    console.log('[Puppeteer] Navigating to WePlay recharge page...');
    await page.goto('https://weplayapp.com/recharge', { waitUntil: 'networkidle2', timeout: 30000 });

    const inputSelector = 'input[placeholder="Enter your WePlay ID"]';
    await page.waitForSelector(inputSelector, { timeout: 12000 });

    await page.click(inputSelector);
    await page.keyboard.down('Control');
    await page.keyboard.press('A');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');

    await page.type(inputSelector, userId, { delay: 60 });

    // Dispatch Vue.js reactive events
    await page.evaluate((selector) => {
      const input = document.querySelector(selector);
      if (input) {
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, inputSelector);

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Click "Next" button
    const clicked = await page.evaluate(() => {
      const allButtons = Array.from(document.querySelectorAll('button, div, span, a'));
      const nextBtn = allButtons.find(el => (el.innerText || el.textContent || '').trim() === 'Next' || el.classList.contains('submit'));
      if (nextBtn) {
        nextBtn.click();
        return true;
      }
      return false;
    });

    if (!clicked) {
      console.log('[Puppeteer] "Next" button not found by evaluate, pressing Enter...');
      await page.keyboard.press('Enter');
    } else {
      console.log('[Puppeteer] Clicked "Next" button.');
    }

    console.log('[Puppeteer] Waiting for user card to render...');
    await new Promise(resolve => setTimeout(resolve, 4000));

    // Scrape exact WePlay account card elements: .account .nickname and .account .avatar
    const userData = await page.evaluate(() => {
      const nickEl = document.querySelector('.account .nickname, .nickname');
      const avatarEl = document.querySelector('.account img.avatar, img.avatar, img[src*="picuser"]');
      
      const name = nickEl ? nickEl.innerText.trim() : null;
      const dp = avatarEl ? avatarEl.src : null;

      return { name, dp };
    });

    console.log('[Puppeteer] Scraped result:', JSON.stringify(userData));
    await browser.close();

    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) {}

    if (!userData.name && !userData.dp) return null;
    return userData;

  } catch (error) {
    console.error('[Puppeteer] Error:', error.message);
    if (browser) { try { await browser.close(); } catch (_) {} }
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) {}
    return null;
  }
}

// ══════════════════════════════════════════════════════════════════════
//  API: GET /api/weplay?id=...
// ══════════════════════════════════════════════════════════════════════
app.get('/api/weplay', async (req, res) => {
  const userId = (req.query.id || '').trim();
  if (!userId) {
    return res.status(400).json({ success: false, error: 'User ID is required' });
  }

  console.log(`\n[API] Request for ID: "${userId}" | Queue: ${scrapeQueue.length} | Lock: ${scrapeLock}`);

  const scraped = await queueScrape(userId);

  if (!scraped) {
    return res.status(404).json({ success: false, error: "user doesn't exist" });
  }

  const userObj = { id: userId, name: scraped.name || userId, dp: scraped.dp || null };
  saveUser(userObj);
  return res.json({ success: true, data: userObj });
});

// ══════════════════════════════════════════════════════════════════════
//  API: POST /api/save-user
// ══════════════════════════════════════════════════════════════════════
app.post('/api/save-user', (req, res) => {
  const u = req.body;
  if (u && u.id) {
    saveUser(u);
    return res.json({ success: true, data: u });
  }
  return res.status(400).json({ success: false, error: 'Invalid payload' });
});

// ══════════════════════════════════════════════════════════════════════
//  Static Serving
// ══════════════════════════════════════════════════════════════════════
app.use(express.static(__dirname, {
  extensions: ['html'],
  setHeaders: (res) => res.setHeader('Cache-Control', 'no-cache')
}));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ══════════════════════════════════════════════════════════════════════
//  Start
// ══════════════════════════════════════════════════════════════════════
app.listen(PORT, () => {
  console.log(`\n✅ WePlay Server: http://localhost:${PORT}/`);
  console.log(`   Opens Chrome to verify WePlay IDs via Puppeteer`);
  console.log(`   Serves: ${path.join(__dirname, 'index.html')}`);
  console.log(`   Cache:  ${USERS_PATH}\n`);
});
