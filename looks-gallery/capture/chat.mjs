// Captures each chat workshop section, the conversation, and the open states (paper terminal, panel, lightbox).
// node capture/chat.mjs out 1440x900 [all|cat|flow|extra]
import { chromium } from '/Users/balazs/Projects/charrette-project/charrette/apps/pitch/node_modules/@playwright/test/index.mjs'
const [out = 'v10', size = '1440x900', which = 'all'] = process.argv.slice(2)
const [w, h] = size.split('x').map(Number)
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 })
const errs = []; p.on('pageerror', e => errs.push(String(e))); p.on('console', m => m.type() === 'error' && errs.push(m.text()))
const open = async (hash) => { await p.goto('about:blank'); await p.goto('http://localhost:5273/?bare' + hash); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500) }
const at = async (id) => { await p.evaluate((id) => document.querySelector('#s-' + id).scrollIntoView({ block: 'start' }), id); await p.waitForTimeout(250) }
if (which === 'all' || which === 'cat') {
  await open('#chat')
  const ids = await p.evaluate(() => [...document.querySelectorAll('[data-spec]')].map(e => e.dataset.spec))
  for (const id of ids) { await at(id); await p.screenshot({ path: `${out}/c-${id}.png` }) }
}
if (which === 'all' || which === 'flow') {
  await open('#chat'); await p.click('.cs-seg-b:has-text("Conversation")'); await p.waitForTimeout(300)
  const H = await p.evaluate(() => document.querySelector('.cs-scroll').scrollHeight)
  for (let y = 0, i = 0; y < H; y += h - 180, i++) {
    await p.evaluate((y) => document.querySelector('.cs-scroll').scrollTop = y, y); await p.waitForTimeout(200)
    await p.screenshot({ path: `${out}/f-${String(i).padStart(2, '0')}.png` })
  }
}
if (which === 'all' || which === 'extra') {
  await open('#chat')
  await p.click('.cs-seg-b:has-text("Paper")'); await at('run'); await p.screenshot({ path: `${out}/x-run-paper.png` })
  await at('snippet'); await p.screenshot({ path: `${out}/x-snip-paper.png` })
  await p.click('.cs-seg-b:has-text("Dark")')
  await at('snippet'); const s = p.locator('.cs-snip .cs-copy.is-label').first(); if (await s.count()) { await s.click(); await p.screenshot({ path: `${out}/x-snip-open.png` }) }
  await at('attach'); await p.hover('.cs-att:not(.is-image)'); await p.screenshot({ path: `${out}/x-att-hover.png` })
  await p.click('.cs-att.is-image'); await p.waitForTimeout(300); await p.screenshot({ path: `${out}/x-lightbox.png` }); await p.keyboard.press('Escape')
  await at('file'); await p.click('.cs-art-prev'); await p.waitForTimeout(400); await p.screenshot({ path: `${out}/x-panel.png` })
}
console.log(errs); await b.close()
