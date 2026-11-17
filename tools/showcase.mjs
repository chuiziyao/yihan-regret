/* Capture README showcase assets: 7 stills (1280x720) + 112 gif frames (640x360) */
import puppeteer from "puppeteer-core";
import fs from "node:fs";
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const browser = await puppeteer.launch({
  executablePath: CHROME, headless: true,
  args: ["--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--force-color-profile=srgb", "--font-render-hinting=none"]
});
const page = await browser.newPage();
await page.goto("file:///D:/0000DSH/qwen4/yihan/index.html?capture=1", { waitUntil: "networkidle0" });
await page.waitForFunction("window.__ready === true", { timeout: 30000 });

fs.mkdirSync("docs/img", { recursive: true });
fs.mkdirSync("docs/gif", { recursive: true });

const STILLS = [[8, "01-prologue"], [37, "02-unsent"], [65, "03-last-train"], [80, "04-photos"], [116, "05-uncalled"], [134, "06-what-if"], [157, "07-epilogue"]];
await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
for (const [t, name] of STILLS) {
  await page.evaluate(t => window.__seek(t), t);
  await page.screenshot({ path: `docs/img/${name}.png`, type: "png" });
  console.log("still", name);
}

const SCENES = [[6.0, "prologue"], [36.0, "unsent"], [55.0, "train"], [82.0, "photos"], [112.0, "uncalled"], [126.0, "whatif"], [146.0, "epilogue"]];
await page.setViewport({ width: 640, height: 360, deviceScaleFactor: 1 });
let i = 0;
for (const [t0] of SCENES) {
  for (let k = 0; k < 16; k++) {
    await page.evaluate(t => window.__seek(t), t0 + k / 10);
    await page.screenshot({ path: `docs/gif/g${String(i++).padStart(3, "0")}.png`, type: "png" });
  }
  console.log("gif scene", t0);
}
await browser.close();
console.log("showcase frames done:", i);