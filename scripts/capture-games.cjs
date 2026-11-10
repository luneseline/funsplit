// Capture real running scenes. Requires `npm run web` and Chromium/CHROMIUM_PATH.
const { chromium } = require("playwright");
const fs = require("node:fs");
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  fs.mkdirSync("docs/images/graphics", { recursive: true });
  try {
    const p = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const games = [
      ["tower", "Stack attack"],
      ["race", "Tap tap, broke"],
      ["price", "Price of nice"],
      ["flight", "Snack flight"],
      ["wheel", "Wheel of owe"],
      ["yapathon", "Yapathon"],
      ["pool", "Pocket money"],
      ["archery", "Bullseye bill"],
    ];
    for (const [id, name] of games) {
      await p.goto(process.env.DEMO_URL || "http://localhost:8081");
      if (await p.getByLabel("Skip opening animation").isVisible())
        await p.getByLabel("Skip opening animation").click();
      await p.getByText(name, { exact: true }).scrollIntoViewIfNeeded();
      await p.getByText(name, { exact: true }).click();
      await p.getByText("Game faces on →", { exact: true }).click();
      if (id === "race") {
        await p.getByText("Start this heat →", { exact: true }).click();
        await p.waitForTimeout(2100);
        for (let i = 0; i < 20; i++)
          await p
            .getByLabel("Tap for You")
            .dispatchEvent("pointerdown", { pointerId: 1 });
        for (let i = 0; i < 12; i++)
          await p
            .getByLabel("Tap for Bestie")
            .dispatchEvent("pointerdown", { pointerId: 2 });
      } else if (id === "wheel") {
        await p.getByText("SPIN THE WHEEL ↻", { exact: true }).click();
        await p
          .getByText("THE WHEEL CHOSE FIRST PICK", { exact: true })
          .waitFor();
      } else if (id === "yapathon") {
        await p.getByText("START YAPPING →", { exact: true }).click();
      } else {
        await p.getByText("I’m ready. Let’s play →", { exact: true }).click();
        if (id === "pool") {
          await p.getByText("Shoot →", { exact: true }).click();
          await p.waitForTimeout(300);
        } else if (id === "flight") {
          await p.getByLabel("Game arena").click();
          await p.waitForTimeout(180);
        } else if (id === "price") {
          await p.getByLabel("Price guess").fill("1600");
        } else if (id === "archery") {
          await p.waitForTimeout(850);
          await p.getByLabel("Game arena").click();
          await p.waitForTimeout(600);
        } else if (id === "tower") {
          await p.getByText("Drop block ↓", { exact: true }).click();
          await p.waitForTimeout(460);
        }
      }
      await p.screenshot({ path: `docs/images/graphics/${id}.png` });
      console.log("Captured", id);
    }
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
