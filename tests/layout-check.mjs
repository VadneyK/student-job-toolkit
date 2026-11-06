#!/usr/bin/env node
// Layout and a11y sweep for any URL in headless Chrome, one pass per viewport width.
// Usage: node layout-check.mjs <url> [--widths 320,375,...] [--out dir] [--json file] [--wait ms]
// Checks per width: no horizontal scroll, no overlapping text boxes, no text over images,
// no overlapping cards, no element under the sticky header after an anchor jump, every image
// loaded, every hash route (#page-* style subpage) renders past the fold with no gap under the footer,
// and axe-core (WCAG 2.0/2.1 A+AA, 2.2 AA) with no serious or critical violations.
// Same-origin iframes (srcdoc too) are checked as part of the page. Exit 1 if any width fails.
// Needs Chrome (CHROME env, or Google Chrome / Chrome for Testing) and axe-core (npm i in this folder,
// or AXE_PATH env). Runs on Node 22+, or Node 20 with --experimental-websocket.
import { spawn } from 'node:child_process';
import fs from 'node:fs'; import path from 'node:path'; import http from 'node:http'; import os from 'node:os';
import { createRequire } from 'node:module'; import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2); const url = args.find(a => !a.startsWith('--') && !/^\d/.test(a) && a.includes(':'));
const opt = k => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : undefined; };
if (!url) { console.error('usage: node layout-check.mjs <url> [--widths 320,375] [--out dir] [--json file]'); process.exit(2); }
const WIDTHS = (opt('widths') || '320,375,414,768,1024,1280,1440,1920,2560').split(',').map(Number);
const OUT = opt('out') || path.join(os.tmpdir(), 'layout-check'); fs.mkdirSync(OUT, { recursive: true });
const WAIT = +(opt('wait') || 2500);
function findChrome() {
  if (process.env.CHROME) return process.env.CHROME;
  const c = ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'];
  const pw = path.join(os.homedir(), 'Library/Caches/ms-playwright');
  if (fs.existsSync(pw)) for (const d of fs.readdirSync(pw).filter(d => d.startsWith('chromium-')).sort().reverse())
    c.unshift(path.join(pw, d, 'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'));
  return c.find(p => fs.existsSync(p));
}
function axeSource() {
  if (process.env.AXE_PATH) return fs.readFileSync(process.env.AXE_PATH, 'utf8');
  for (const base of [process.cwd() + '/', HERE + '/']) { try { return fs.readFileSync(createRequire(base + 'x.js').resolve('axe-core/axe.min.js'), 'utf8'); } catch {} }
  throw new Error('axe-core not found: npm i axe-core in ' + HERE + ' or set AXE_PATH');
}
const AXE = axeSource();
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Runs inside the page. Returns findings for one viewport.
const PROBE = String(async function probe() {
  document.documentElement.style.scrollBehavior = 'auto'; document.body.style.scrollBehavior = 'auto';
  const W = innerWidth, out = { hscroll: null, overlaps: [], textOverImage: [], cards: [], underHeader: [], routes: [], images: [], axe: [] };
  // Hash routes: in-page links whose target is hidden at load (single-page subpages such as #page-*).
  const routeIds = [...new Set([...document.querySelectorAll('a[href^="#"]')].map(a => a.getAttribute('href').slice(1)))].filter(id => { const t = id && document.getElementById(id); return t && (t.hidden || getComputedStyle(t).display === 'none'); });
  const vis = (el, win) => { const s = win.getComputedStyle(el); return s.display !== 'none' && s.visibility !== 'hidden' && +s.opacity > 0.05; };
  const label = el => (el.id ? '#' + el.id : el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '')) + ' "' + (el.textContent || el.alt || '').trim().replace(/\s+/g, ' ').slice(0, 40) + '"';
  // Hide fixed overlays that are not the sticky header (cookie banners, toasts, chat bubbles).
  const header = [...document.querySelectorAll('header,[class*=header]')].find(e => /sticky|fixed/.test(getComputedStyle(e).position));
  for (const el of document.querySelectorAll('body *')) { const p = getComputedStyle(el).position; if (p === 'fixed' && el !== header && !el.contains(header)) el.setAttribute('data-lc-hidden', el.style.display || ''), el.style.display = 'none'; }
  // Scroll through to trigger lazy images and reveal animations.
  const H = () => document.documentElement.scrollHeight;
  for (let y = 0; y < H(); y += Math.round(innerHeight * 0.8)) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); }
  scrollTo(0, 0); await new Promise(r => setTimeout(r, 600));
  document.querySelectorAll('.reveal').forEach(e => e.classList.add('in', 'visible', 'is-visible', 'revealed'));
  const sw = document.documentElement.scrollWidth;
  if (sw > W + 1) {
    const wide = [...document.querySelectorAll('body *')].filter(e => { const r = e.getBoundingClientRect(); return r.right > W + 1 && r.width > 0 && vis(e, window); })
      .filter(e => { for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) { const o = getComputedStyle(a); if (/(hidden|auto|scroll|clip)/.test(o.overflowX)) return false; } return true; });
    out.hscroll = { scrollWidth: sw, offenders: wide.slice(0, 6).map(label) };
  }
  // Collect boxes from the page and same-origin iframes, in top-document coordinates.
  const texts = [], imgs = [], cards = [];
  const clipOf = (el, win) => { let c = { l: -1e9, t: -1e9, r: 1e9, b: 1e9 }; for (let a = el; a && a !== win.document.documentElement; a = a.parentElement) { const o = win.getComputedStyle(a); if (/(hidden|auto|scroll|clip)/.test(o.overflow + o.overflowX + o.overflowY)) { const r = a.getBoundingClientRect(); c = { l: Math.max(c.l, r.left), t: Math.max(c.t, r.top), r: Math.min(c.r, r.right), b: Math.min(c.b, r.bottom) }; } } return c; };
  let FR = null; // visible rect of the iframe being collected, in top-document coordinates
  const add = (list, el, r, win, dx, dy, extra) => { const c = clipOf(el, win); const b = { l: Math.max(r.left, c.l) + dx, t: Math.max(r.top, c.t) + dy, r: Math.min(r.right, c.r) + dx, b: Math.min(r.bottom, c.b) + dy }; if (FR) { b.l = Math.max(b.l, FR.l); b.t = Math.max(b.t, FR.t); b.r = Math.min(b.r, FR.r); b.b = Math.min(b.b, FR.b); } if (b.r - b.l > 2 && b.b - b.t > 2) list.push({ el, ...b, ...extra }); };
  function collect(doc, win, dx, dy, depth) {
    for (const el of doc.querySelectorAll('body *')) {
      if (!vis(el, win) || el.closest('.sr-only,.visually-hidden') || el.closest('[aria-hidden=true],svg,script,style,noscript,[hidden]')) continue;
      if (el.tagName === 'IFRAME') { try { const d = el.contentDocument; if (d && d.body && depth < 2) { const r = el.getBoundingClientRect(); const prev = FR; FR = { l: r.left + dx, t: r.top + dy, r: r.right + dx, b: r.bottom + dy }; collect(d, el.contentWindow, dx + r.left, dy + r.top, depth + 1); FR = prev; } } catch {} continue; }
      if (el.tagName === 'IMG') { if (el.alt !== '' ) { const r = el.getBoundingClientRect(); if (r.width > 24) add(imgs, el, r, win, dx, dy, {}); } continue; }
      for (const n of el.childNodes) if (n.nodeType === 3 && n.textContent.trim()) { const rg = doc.createRange(); rg.selectNodeContents(n); for (const r of rg.getClientRects()) add(texts, el, r, win, dx, dy, {}); }
      const s = win.getComputedStyle(el), r = el.getBoundingClientRect();
      if (r.width >= 140 && r.height >= 90 && parseFloat(s.borderRadius) >= 6 && (s.boxShadow !== 'none' || parseFloat(s.borderTopWidth) > 0) && s.backgroundColor !== 'rgba(0, 0, 0, 0)' && !/absolute|fixed/.test(s.position)) add(cards, el, r, win, dx, dy, {});
    }
  }
  collect(document, window, 0, 0, 0);
  const inter = (a, b) => Math.max(0, Math.min(a.r, b.r) - Math.max(a.l, b.l)) * Math.max(0, Math.min(a.b, b.b) - Math.max(a.t, b.t));
  const area = a => (a.r - a.l) * (a.b - a.t);
  const related = (a, b) => a.el === b.el || a.el.contains(b.el) || b.el.contains(a.el);
  const seen = new Set();
  const push = (list, a, b) => { const k = label(a.el) + '|' + label(b.el); if (!seen.has(k) && list.length < 12) { seen.add(k); list.push(label(a.el) + '  x  ' + label(b.el)); } };
  for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) { const a = texts[i], b = texts[j]; if (related(a, b)) continue; const x = inter(a, b); if (x > 0.25 * Math.min(area(a), area(b)) && x > 20) push(out.overlaps, a, b); }
  const ownBg = (el) => { for (let a = el; a && a.tagName !== 'BODY'; a = a.parentElement) { const s = a.ownerDocument.defaultView.getComputedStyle(a); if (s.backgroundColor !== 'rgba(0, 0, 0, 0)' || s.backdropFilter !== 'none') return a; } return null; };
  for (const t of texts) for (const m of imgs) { if (related(t, m)) continue; const bg = ownBg(t.el); if (bg && !bg.contains(m.el)) continue; const x = inter(t, m); if (x > 0.3 * area(t) && x > 40) push(out.textOverImage, t, m); }
  for (let i = 0; i < cards.length; i++) for (let j = i + 1; j < cards.length; j++) { const a = cards[i], b = cards[j]; if (related(a, b)) continue; if (inter(a, b) > 0.02 * Math.min(area(a), area(b)) && inter(a, b) > 100) push(out.cards, a, b); }
  // Anchor jumps: the target's first heading or text must sit below the sticky header.
  if (header) {
    const ids = [...new Set([...document.querySelectorAll('a[href^="#"]')].map(a => a.getAttribute('href').slice(1)))].filter(id => id && document.getElementById(id) && !document.getElementById(id).closest('[hidden]'));
    for (const id of ids) {
      const t = document.getElementById(id); if (t.offsetParent === null) continue;
      location.hash = '#' + id; await new Promise(r => setTimeout(r, 700));
      if (scrollY + innerHeight >= document.documentElement.scrollHeight - 2) continue; // page end cannot scroll further
      const hb = header.getBoundingClientRect().bottom;
      const first = t.matches('h1,h2,h3') ? t : (t.querySelector('h1,h2,h3,.eyebrow,p') || t);
      const top = first.getBoundingClientRect().top;
      if (top < hb - 1) out.underHeader.push('#' + id + ' first content at ' + Math.round(top) + 'px, header ends ' + Math.round(hb) + 'px');
    }
    history.replaceState(null, '', location.pathname); scrollTo(0, 0);
  }
  // Each hash route must render: visible, at least the viewport below the header, and no empty gap under the footer.
  for (const id of routeIds) {
    location.hash = '#' + id; await new Promise(r => setTimeout(r, 600));
    const t = document.getElementById(id), r = t.getBoundingClientRect(), hh = header ? header.getBoundingClientRect().height : 0;
    const foot = [...document.querySelectorAll('footer')].filter(f => f.offsetParent !== null).pop();
    const docH = document.documentElement.scrollHeight, fb = foot ? foot.getBoundingClientRect().bottom + scrollY : docH;
    const textLen = (t.innerText || '').trim().length;
    if (r.height < innerHeight - hh - 2 || textLen < 200) out.routes.push('#' + id + ' renders ' + Math.round(r.height) + 'px tall, ' + textLen + ' chars (fold is ' + Math.round(innerHeight - hh) + 'px)');
    else if (docH < innerHeight - 1 || fb < innerHeight - 2) out.routes.push('#' + id + ' leaves an empty gap under the footer (page ' + docH + 'px, viewport ' + innerHeight + 'px)');
  }
  if (routeIds.length) { history.replaceState(null, '', location.pathname); window.dispatchEvent(new HashChangeEvent('hashchange')); scrollTo(0, 0); await new Promise(r => setTimeout(r, 300)); }
  // Images.
  const allImgs = []; (function walk(doc, d) { allImgs.push(...doc.images); if (d < 2) for (const f of doc.querySelectorAll('iframe')) { try { if (f.contentDocument) walk(f.contentDocument, d + 1); } catch {} } })(document, 0);
  for (const im of allImgs) { if (im.loading === 'lazy' && !im.complete) { im.loading = 'eager'; await new Promise(r => { im.onload = im.onerror = r; setTimeout(r, 3000); }); } if (!im.complete || im.naturalWidth === 0) out.images.push((im.currentSrc || im.src || '(no src)').slice(0, 90)); }
  // axe.
  const res = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] }, resultTypes: ['violations'] });
  out.axe = res.violations.filter(v => v.impact === 'serious' || v.impact === 'critical').map(v => v.id + ' (' + v.nodes.length + '): ' + v.nodes.slice(0, 3).map(n => n.target.join(' ')).join(' | '));
  for (const el of document.querySelectorAll('[data-lc-hidden]')) { el.style.display = el.getAttribute('data-lc-hidden'); el.removeAttribute('data-lc-hidden'); }
  return out;
});

const port = 9600 + Math.floor(Math.random() * 300);
const chrome = spawn(findChrome(), [...(process.env.CI ? ['--no-sandbox'] : []), '--headless=new', '--disable-gpu', '--mute-audio', '--hide-scrollbars', '--autoplay-policy=user-gesture-required', `--remote-debugging-port=${port}`, `--user-data-dir=${path.join(os.tmpdir(), 'lc-' + port)}`, 'about:blank'], { stdio: 'ignore' });
const getJSON = p => new Promise((r, j) => http.get(`http://127.0.0.1:${port}${p}`, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => r(JSON.parse(d))); }).on('error', j));
let list; for (let i = 0; i < 60 && !list; i++) { try { list = await getJSON('/json'); } catch { await sleep(250); } }
const ws = new WebSocket(list.find(t => t.type === 'page').webSocketDebuggerUrl);
let id = 0; const pend = {}; const send = (method, params = {}) => new Promise(r => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
ws.addEventListener('message', ev => { const d = JSON.parse(ev.data); if (d.id && pend[d.id]) pend[d.id](d); });
await new Promise(r => ws.addEventListener('open', r));
await send('Page.enable'); await send('Runtime.enable');
const rows = []; let failed = false;
for (const w of WIDTHS) {
  const h = w < 768 ? 812 : w < 1280 ? 1024 : w >= 1920 ? 1200 : 900;
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 768 });
  await send('Page.navigate', { url }); await sleep(WAIT);
  await send('Runtime.evaluate', { expression: AXE });
  const r = await send('Runtime.evaluate', { expression: `(${PROBE})()`, returnByValue: true, awaitPromise: true });
  const f = r.result?.result?.value || { error: r.result?.exceptionDetails?.exception?.description || JSON.stringify(r) };
  // Full-page screenshot.
  const m = await send('Page.getLayoutMetrics'); const fullH = Math.min(16000, Math.ceil(m.result.cssContentSize.height));
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: fullH, deviceScaleFactor: 1, mobile: w < 768 }); await sleep(500);
  const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 55 });
  const file = path.join(OUT, `layout-${w}.jpg`); fs.writeFileSync(file, Buffer.from(shot.result.data, 'base64'));
  const n = k => f.error ? '?' : (k === 'hscroll' ? (f.hscroll ? 1 : 0) : f[k].length);
  const row = { width: w, hscroll: n('hscroll'), textOverlap: n('overlaps'), textOverImage: n('textOverImage'), cardOverlap: n('cards'), underHeader: n('underHeader'), routes: n('routes'), brokenImages: n('images'), axeSerious: n('axe'), screenshot: file, details: f };
  row.pass = !f.error && Object.entries(row).every(([k, v]) => !['hscroll', 'textOverlap', 'textOverImage', 'cardOverlap', 'underHeader', 'routes', 'brokenImages', 'axeSerious'].includes(k) || v === 0);
  failed ||= !row.pass; rows.push(row);
  console.error(`${w}px ${row.pass ? 'PASS' : 'FAIL'}`);
}
chrome.kill();
console.log('| Width | H-scroll | Text overlap | Text over image | Card overlap | Under header | Hash routes | Broken images | axe serious | Result |');
console.log('|---|---|---|---|---|---|---|---|---|---|');
for (const r of rows) console.log(`| ${r.width} | ${r.hscroll} | ${r.textOverlap} | ${r.textOverImage} | ${r.cardOverlap} | ${r.underHeader} | ${r.routes} | ${r.brokenImages} | ${r.axeSerious} | ${r.pass ? 'pass' : 'FAIL'} |`);
for (const r of rows.filter(r => !r.pass)) { console.log(`\n${r.width}px:`); for (const [k, v] of Object.entries(r.details)) if (v && (Array.isArray(v) ? v.length : true)) console.log('  ' + k + ': ' + (Array.isArray(v) ? v.join('\n    ') : JSON.stringify(v))); }
if (opt('json')) fs.writeFileSync(opt('json'), JSON.stringify(rows, null, 2));
console.log('\nScreenshots: ' + OUT);
process.exit(failed ? 1 : 0);
