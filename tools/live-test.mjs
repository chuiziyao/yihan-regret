/* Interaction QA: gate, playback, pause, chapters, scrub, mute, end-loop, mobile */
import puppeteer from "puppeteer-core";
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const browser = await puppeteer.launch({
  executablePath: CHROME, headless: true,
  args: ["--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--force-color-profile=srgb"]
});
const errors = [];
const page = await browser.newPage();
page.on("pageerror", e => errors.push("PAGE: " + e.message));
page.on("console", m => { if (m.type() === "error") errors.push("CONSOLE: " + m.text()); });
await page.setViewport({ width: 1440, height: 900 });
await page.goto("file:///D:/0000DSH/qwen4/yihan/index.html", { waitUntil: "networkidle0" });
await page.waitForFunction("window.__ready === true", { timeout: 20000 });
await page.screenshot({ path: "samples/live-gate.png" });

const T = () => page.evaluate(() => state.t);
const P = () => page.evaluate(() => state.playing);

await page.click("#startBtn");
await new Promise(r => setTimeout(r, 1600));
console.log("after start: playing=", await P(), "t=", (await T()).toFixed(2));
await page.mouse.move(700, 400);
await page.screenshot({ path: "samples/live-playing.png" });

await page.keyboard.press("Space");
console.log("after space: playing=", await P());
await page.keyboard.press("Space");

await page.click("#chapBtn");
await new Promise(r => setTimeout(r, 350));
await page.screenshot({ path: "samples/live-chapters.png" });
await page.evaluate(() => document.querySelectorAll(".chap")[2].click());
await new Promise(r => setTimeout(r, 400));
console.log("after chapter 3: t=", (await T()).toFixed(2), "playing=", await P());
await page.mouse.move(720, 450);
await page.screenshot({ path: "samples/live-train.png" });

/* scrub to ~80% */
const box = await page.evaluate(() => { const r = document.getElementById("scrub").getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
await page.mouse.move(box.x + box.w * .5, box.y + box.h / 2);
await page.mouse.down();
await page.mouse.move(box.x + box.w * .8, box.y + box.h / 2, { steps: 8 });
await page.mouse.up();
console.log("after scrub 80%: t=", (await T()).toFixed(2));

await page.click("#muteBtn");
console.log("muted=", await page.evaluate(() => AudioEngine.muted));
await page.click("#muteBtn");

/* run to the end */
await page.evaluate(() => { seek(159.4); play(); });
await new Promise(r => setTimeout(r, 1400));
console.log("end overlay shown=", await page.evaluate(() => document.getElementById("endOverlay").classList.contains("show")), "playing=", await P());
await page.screenshot({ path: "samples/live-end.png" });
await page.click("#againBtn");
await new Promise(r => setTimeout(r, 500));
console.log("after replay: t=", (await T()).toFixed(2), "playing=", await P());

/* mobile */
const m = await browser.newPage();
m.on("pageerror", e => errors.push("MOBILE PAGE: " + e.message));
await m.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
await m.goto("file:///D:/0000DSH/qwen4/yihan/index.html", { waitUntil: "networkidle0" });
await m.waitForFunction("window.__ready === true", { timeout: 20000 });
await m.screenshot({ path: "samples/live-mobile-gate.png" });
await m.tap("#startBtn");
await new Promise(r => setTimeout(r, 1200));
await m.touchscreen.tap(200, 300);
await m.screenshot({ path: "samples/live-mobile.png" });

console.log(errors.length ? "ERRORS:\n" + errors.join("\n") : "NO ERRORS");
await browser.close();