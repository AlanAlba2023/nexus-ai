#!/usr/bin/env node
/**
 * Smoke check for the Nuvora site and deck.
 *
 * Answers one question: is it still alive? Not "is it correct" — just:
 * the pages load, the deck component boots, the controls are mounted and
 * nothing 404s. Logic lives elsewhere; this is the pre-deploy guard.
 *
 * Zero dependencies. Uses the Chrome already installed on the machine.
 *
 *   node scripts/smoke.js            # checks the local working tree
 *   node scripts/smoke.js --quiet    # only prints failures
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const os = require('os');

const ROOT = path.resolve(__dirname, '..');
const QUIET = process.argv.includes('--quiet');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
};

function findChrome() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ];
  for (const c of candidates) if (fs.existsSync(c)) return c;
  throw new Error('No Chrome or Edge found. Smoke check needs a browser binary.');
}

const missing = [];
// Browsers request /favicon.ico before any HTML is parsed; that is not a deck
// asset, so it never counts as a broken reference here.
function missingAssets() {
  return missing.filter((u) => u !== '/favicon.ico');
}
const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
  let filePath = path.join(ROOT, urlPath);

  if (urlPath === '/' || urlPath === '') filePath = path.join(ROOT, 'index.html');
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }
  // cleanUrls parity: /deck -> /deck/index.html
  if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
    filePath += '.html';
  }

  if (!fs.existsSync(filePath)) {
    missing.push(urlPath);
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

// Must stay async: this process also serves the files Chrome is fetching.
function dumpDom(chrome, url) {
  const userDir = fs.mkdtempSync(path.join(os.tmpdir(), 'smoke-'));
  return new Promise((resolve, reject) => {
    execFile(
      chrome,
      [
        '--headless=new',
        '--disable-gpu',
        '--no-first-run',
        '--no-sandbox',
        `--user-data-dir=${userDir}`,
        '--virtual-time-budget=8000',
        '--dump-dom',
        url,
      ],
      { maxBuffer: 64 * 1024 * 1024, timeout: 60000 },
      (err, stdout) => {
        fs.rmSync(userDir, { recursive: true, force: true });
        if (err && !stdout) return reject(err);
        resolve(stdout.toString());
      }
    );
  });
}

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok, detail });
}

async function main() {
  const chrome = findChrome();

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;

  // --- 1. static: deck assets must be root-absolute (Vercel cleanUrls serves
  //        /deck without a trailing slash, so ./file resolves to the site root)
  const deckHtml = fs.readFileSync(path.join(ROOT, 'deck', 'index.html'), 'utf8');
  const relativeRefs = [...deckHtml.matchAll(/(?:src|href)="(\.\/[^"]+|[a-z_]+[/][^"]+)"/g)]
    .map((m) => m[1])
    .filter((u) => !u.startsWith('/') && !u.startsWith('http'));
  check(
    'deck/index.html uses root-absolute asset paths',
    relativeRefs.length === 0,
    relativeRefs.length ? `relative refs: ${relativeRefs.join(', ')}` : undefined
  );

  // --- 2. landing loads with no missing assets
  missing.length = 0;
  const landing = await dumpDom(chrome, `${base}/`);
  check('landing renders', landing.includes('<!DOCTYPE html') || landing.length > 1000);
  check('landing has no missing assets', missingAssets().length === 0, missingAssets().join(', '));

  // --- 3. deck (full) boots: component upgraded, nav pill mounted
  missing.length = 0;
  const deck = await dumpDom(chrome, `${base}/deck/index.html`);
  check('deck loads', deck.includes('deck-stage'));
  check('deck has no missing assets', missingAssets().length === 0, missingAssets().join(', '));
  check('deck mounts the navigation pill', deck.includes('nv-nav'));
  check('deck shows a slide counter', /\d+\s*\/\s*7/.test(deck));

  // --- 4. demo mode: rail hidden, CTA mounted, chat present
  missing.length = 0;
  const demo = await dumpDom(chrome, `${base}/deck/index.html?demo=1#4`);
  check('demo loads', demo.includes('deck-stage'));
  check('demo has no missing assets', missingAssets().length === 0, missingAssets().join(', '));
  check('demo mounts the CTA', demo.includes('nv-cta'));
  check('demo does not mount the pager pill', !demo.includes('id="nv-nav"'));
  check('demo renders the agent chat', demo.includes('As\u00ed conversa el agente'));

  server.close();

  // --- report
  const failed = results.filter((r) => !r.ok);
  if (!QUIET) {
    for (const r of results) {
      console.log(`${r.ok ? 'ok  ' : 'FAIL'}  ${r.name}${r.detail ? '  ->  ' + r.detail : ''}`);
    }
  } else {
    for (const r of failed) console.log(`FAIL  ${r.name}  ->  ${r.detail || ''}`);
  }
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);

  if (failed.length) process.exit(1);
}

main().catch((err) => {
  console.error('smoke check crashed:', err.message);
  process.exit(1);
});
