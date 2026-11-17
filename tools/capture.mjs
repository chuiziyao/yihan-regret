/* Deterministic frame capture of the film via headless Chrome.
   node tools/capture.mjs          -> full 3840 frames (24fps x 160s)
   node tools/capture.mjs sample   -> key frames for visual QA          */
import puppeteer from "puppeteer-core";
import fs from "node:fs";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const FPS = 24, DUR = 160;
const SAMPLES = [8, 22, 30, 37, 41, 52, 58, 65, 80, 88, 94, 104, 110, 116, 128, 134, 138, 148, 153, 157];
const mode = process.argv[2] || "full";

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox", "--disable-gpu", "--hide-scrollbars",
    "--force-color-profile=srgb", "--font-render-hinting=none",
    "--disable-lcd-text", "--window-size=1920,1080"]
});
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
page.on("pageerror", e => console.error("PAGE ERROR:", e.message));
page.on("console", m => { if (m.type() === "error") console.error("CONSOLE:", m.text()); });
await page.goto("file:///D:/0000DSH/qwen4/yihan/index.html?capture=1", { waitUntil: "networkidle0" });
await page.waitForFunction("window.__ready === true", { timeout: 30000 });
await new Promise(r => setTimeout(r, 300));

if (mode === "sample") {
  fs.mkdirSync("samples", { recursive: true });
  for (const t of SAMPLES) {
    await page.evaluate(t => window.__seek(t), t);
    await page.screenshot({ path: `samples/t${String(t).padStart(3, "0")}.png`, type: "png" });
    console.log("sample", t);
  }
} else {
  fs.mkdirSync("frames", { recursive: true });
  const total = DUR * FPS;
  const t0 = Date.now();
  for (let i = 0; i < total; i++) {
    await page.evaluate(t => window.__seek(t), i / FPS);
    await page.screenshot({ path: `frames/f${String(i).padStart(5, "0")}.jpg`, type: "jpeg", quality: 93 });
    if (i % 240 === 0) {
      const el = (Date.now() - t0) / 1000;
      console.log(`frame ${i}/${total}  t=${(i / FPS).toFixed(1)}s  elapsed=${el | 0}s  eta=${(el / Math.max(i, 1) * (total - i)) | 0}s`);
    }
  }
  /* poster stills */
  for (const [t, name] of [[156.5, "poster-end"], [8, "poster-title"]]) {
    await page.evaluate(t => window.__seek(t), t);
    await page.screenshot({ path: `${name}.png`, type: "png" });
  }
  console.log(`DONE ${total} frames in ${((Date.now() - t0) / 1000) | 0}s`);
}
await browser.close();