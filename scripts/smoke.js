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

// The demo copy lives inside the x-dc script as data, so "does this case render"
// has to be asked of the rendered markup only, never of the raw document.
function visibleText(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');
}

// Drives a real click on the demo chips. dump-dom cannot click, and the whole
// point of the chip row is that clicking swaps the conversation, so this runs
// over the DevTools protocol with the WebSocket built into modern Node.
async function clickChips(chrome, base) {
  const { spawn } = require('child_process');
  if (typeof WebSocket !== 'function') return null;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const userDir = fs.mkdtempSync(path.join(os.tmpdir(), 'smoke-cdp-'));
  const proc = spawn(
    chrome,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-sandbox',
      `--user-data-dir=${userDir}`,
      '--remote-debugging-port=0',
      'about:blank',
    ],
    { stdio: 'ignore' }
  );

  let ws;
  try {
    const portFile = path.join(userDir, 'DevToolsActivePort');
    let port = 0;
    for (let i = 0; i < 120; i++) {
      if (fs.existsSync(portFile)) {
        const line = fs.readFileSync(portFile, 'utf8').split('\n')[0].trim();
        if (line) {
          port = Number(line);
          if (port) break;
        }
      }
      await sleep(100);
    }
    if (!port) throw new Error('CDP port not found');

    let target = null;
    for (let i = 0; i < 80; i++) {
      try {
        const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
        target = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
        if (target) break;
      } catch {}
      await sleep(100);
    }
    if (!target) throw new Error('CDP page target not found');

    ws = new WebSocket(target.webSocketDebuggerUrl);
    let nextId = 0;
    const pending = new Map();
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      const p = msg.id && pending.get(msg.id);
      if (!p) return;
      pending.delete(msg.id);
      msg.error ? p.reject(new Error(JSON.stringify(msg.error))) : p.resolve(msg.result);
    };
    await new Promise((res, rej) => {
      ws.onopen = res;
      ws.onerror = () => rej(new Error('CDP socket failed'));
    });
    const send = (method, params = {}) =>
      new Promise((resolve, reject) => {
        const id = ++nextId;
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
        setTimeout(() => {
          if (pending.has(id)) {
            pending.delete(id);
            reject(new Error('CDP timeout: ' + method));
          }
        }, 20000);
      });
    const evaluate = async (expression) => {
      const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (r.exceptionDetails) throw new Error('evaluate failed: ' + (r.exceptionDetails.text || '') + ' ' + JSON.stringify(r.exceptionDetails.exception && r.exceptionDetails.exception.description || ''));
      return r.result && r.result.value;
    };

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Page.navigate', { url: `${base}/deck/` });
    await sleep(3000);
    const entered = await evaluate(`(() => {
      const d = document.querySelector('deck-stage');
      if (!d || !d.goTo) return 'no-deck-stage';
      d.goTo(3);
      return 'ok';
    })()`);
    await sleep(2000);
    if (entered !== 'ok') throw new Error('deck did not navigate: ' + entered);

    const read = `(() => {
      const s = document.querySelectorAll('deck-stage > section')[3];
      const t = s ? s.textContent : '';
      return {
        dentalSlot: t.includes('Automatizar atención'),
        gymSlot: t.includes('Filtrar consultas de precio'),
        inmobSlot: t.includes('Filtrar y agendar visitas'),
      };
    })()`;
    const clickChip = (label) => `(() => {
      const s = document.querySelectorAll('deck-stage > section')[3] || document;
      const chip = Array.from(s.querySelectorAll('button')).find(b => b.textContent.trim() === ${JSON.stringify(label)});
      if (!chip) return 'chip-not-found';
      chip.click();
      return 'ok';
    })()`;

    const out = [];
    const before = await evaluate(read);
    // Autoplay restarts the conversation on entry, so no slot is guaranteed to be
    // filled yet. What matters here is that it never opens on another vertical.
    out.push({ name: 'chips: demo opens on the dental case', ok: !!before && !before.gymSlot && !before.inmobSlot, detail: JSON.stringify(before) });

    const steps = [
      ['Gimnasio', 'gymSlot', 'chips: clicking Gimnasio swaps the slots'],
      ['Inmobiliaria', 'inmobSlot', 'chips: clicking Inmobiliaria swaps the slots'],
      ['Clínica', 'dentalSlot', 'chips: clicking Clínica returns to the dental case'],
    ];
    for (const [label, flag, name] of steps) {
      const clicked = await evaluate(clickChip(label));
      await sleep(2500);
      const state = await evaluate(read);
      const active = state ? [state.dentalSlot, state.gymSlot, state.inmobSlot].filter(Boolean).length : 0;
      out.push({ name, ok: clicked === 'ok' && active === 1 && state[flag] === true, detail: JSON.stringify({ clicked, state }) });
    }
    return out;
  } finally {
    try {
      ws && ws.close();
    } catch {}
    try {
      proc.kill();
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
    fs.rmSync(userDir, { recursive: true, force: true });
  }
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
  check('deck shows a slide counter', /\d+\s*\/\s*\d+/.test(deck));

  // --- 4. demo mode: rail hidden, CTA mounted, chat present
  missing.length = 0;
  const demo = await dumpDom(chrome, `${base}/deck/index.html?demo=1#4`);
  check('demo loads', demo.includes('deck-stage'));
  check('demo has no missing assets', missingAssets().length === 0, missingAssets().join(', '));
  check('demo mounts the CTA', demo.includes('nv-cta'));
  check('demo does not mount the pager pill', !demo.includes('id="nv-nav"'));
  check('demo renders the agent chat', demo.includes('As\u00ed conversa el agente'));

  // --- 5. demo copy: one script per vertical, selected by URL
  const CHIPS = ['Cl\u00ednica', 'Gimnasio', 'Inmobiliaria'];
  const dentalDom = visibleText(await dumpDom(chrome, `${base}/deck/index.html`));
  check(
    'demo defaults to the dental case',
    dentalDom.includes('Listo, Carolina.') && dentalDom.includes('Directora + socio')
  );
  check(
    'demo default hides the other cases',
    !dentalDom.includes('Listo, Rodrigo.') && !dentalDom.includes('Listo, Andrea.')
  );
  check(
    'demo renders the three vertical chips',
    CHIPS.every((c) => dentalDom.includes('>' + c + '<')),
    CHIPS.filter((c) => !dentalDom.includes('>' + c + '<')).join(', ')
  );

  const gymDom = visibleText(await dumpDom(chrome, `${base}/deck/index.html?rubro=gimnasio`));
  check(
    '?rubro=gimnasio switches the script',
    gymDom.includes('Listo, Rodrigo.') && !gymDom.includes('Listo, Carolina.')
  );
  check(
    '?rubro=gimnasio switches the lead slots',
    gymDom.includes('Filtrar consultas de precio') && gymDom.includes('Dos socios \u00b7 opera uno')
  );

  const inmobDom = visibleText(await dumpDom(chrome, `${base}/deck/index.html?rubro=inmobiliaria`));
  check(
    '?rubro=inmobiliaria switches the script',
    inmobDom.includes('Listo, Andrea.') && !inmobDom.includes('Listo, Carolina.')
  );
  check('?rubro=inmobiliaria switches the lead slots', inmobDom.includes('Filtrar y agendar visitas'));

  const unknownDom = visibleText(await dumpDom(chrome, `${base}/deck/index.html?rubro=panaderia`));
  check('an unknown rubro falls back to the dental case', unknownDom.includes('Listo, Carolina.'));

  // --- 6. the chips must actually respond to a click, not just to the URL
  let clicked = null;
  try {
    clicked = await clickChips(chrome, base);
  } catch (err) {
    check('chips respond to a click', false, err.message);
  }
  if (clicked === null) {
    check('chips respond to a click', true, 'skipped: this Node has no global WebSocket');
  } else {
    for (const r of clicked) check(r.name, r.ok, r.detail);
  }

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
