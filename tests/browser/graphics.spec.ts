import { test, expect, type Page } from "@playwright/test";
import { initialPool, stepPool } from "../../src/render/physics";
async function open(page: Page, name: string) {
  await page.goto("/");
  await page.getByText(name, { exact: true }).click();
  await page.getByText("Game faces on →", { exact: true }).click();
}
const ready = (page: Page) =>
  page.getByText("I’m ready. Let’s play →", { exact: true }).click();
test("Stack Attack: continuous crane movement, falling block lock and scored landing", async ({
  page,
}) => {
  await open(page, "Stack attack");
  await ready(page);
  const block = page.getByTestId("falling-block"),
    first = (await block.boundingBox())!;
  await expect
    .poll(async () => (await block.boundingBox())!.x)
    .not.toBe(first.x);
  await page.getByText("Drop block ↓", { exact: true }).click();
  await expect(page.getByText("Incoming…", { exact: true })).toBeVisible();
  await expect(page.getByText("1 FLOORS", { exact: true })).toBeVisible();
  await expect(
    page.getByTestId("scene-tower").locator("linearGradient"),
  ).not.toHaveCount(0);
});
test("Tap Tap Broke: both runners respond to their own inputs and winner retains 60-tap rule", async ({
  page,
}) => {
  await open(page, "Tap tap, broke");
  await page.getByText("Start this heat →", { exact: true }).click();
  await page.waitForTimeout(2100);
  for (let i = 0; i < 59; i++) {
    await page
      .getByLabel("Tap for You")
      .dispatchEvent("pointerdown", { pointerId: 1 });
    if (i < 5)
      await page
        .getByLabel("Tap for Bestie")
        .dispatchEvent("pointerdown", { pointerId: 2 });
  }
  await expect(
    page.getByTestId("scene-race").getByTestId("sprite-moving"),
  ).toHaveCount(2);
  await expect(
    page.getByText("Heat winner: You", { exact: true }),
  ).not.toBeVisible();
  await page
    .getByLabel("Tap for You")
    .dispatchEvent("pointerdown", { pointerId: 1 });
  await expect(
    page.getByText("Heat winner: You", { exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("sprite-winning")).toBeVisible();
  await expect(page.getByTestId("sprite-losing")).toBeVisible();
});
test("Price of Nice: product showcase seals without revealing the answer or changing guess score", async ({
  page,
}) => {
  await open(page, "Price of nice");
  await ready(page);
  await expect(
    page.getByText("GG Marmont small shoulder bag", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("$2,220", { exact: true })).not.toBeVisible();
  await page.getByLabel("Price guess").fill("2220");
  await page.getByText("Lock in guess", { exact: true }).click();
  await expect(page.getByText("SEALED", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Price guess")).toHaveAttribute("readonly", "");
  await page.getByText("Save score & pass it on →", { exact: true }).click();
  await expect(
    page.getByText("Bestie, you’re up.", { exact: true }),
  ).toBeVisible();
});
test("Snack Flight: live motion responds to flap and a collision ends the turn", async ({
  page,
}) => {
  await open(page, "Snack flight");
  await ready(page);
  const sprite = page.getByTestId("sprite-jumping"),
    first = (await sprite.boundingBox())!;
  await expect
    .poll(async () => (await sprite.boundingBox())!.y)
    .not.toBe(first.y);
  await page.getByLabel("Game arena").click();
  await expect(
    page.getByTestId("scene-flight").locator("linearGradient"),
  ).not.toHaveCount(0);
  await expect(
    page.getByText("Save score & pass it on →", { exact: true }),
  ).toBeVisible({ timeout: 10000 });
  await expect(page.getByTestId("sprite-losing")).toBeVisible();
});
test("Wheel of Owe: spinning wheel lands on the sector selected by the original rule", async ({
  page,
}) => {
  await open(page, "Wheel of owe");
  await page.evaluate(() => (Math.random = () => 0.35));
  await page.getByText("Spin my fate ↻", { exact: true }).click();
  await expect(page.getByTestId("wheel-disc")).toBeVisible();
  await expect(
    page.getByText("40 points. Fate has spoken.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("wheel-disc")).toHaveCSS("transform", /matrix/);
  const degrees = await page.getByTestId("wheel-disc").evaluate((el) => {
    const m = new DOMMatrix(getComputedStyle(el).transform);
    return ((Math.atan2(m.b, m.a) * 180) / Math.PI + 360) % 360;
  });
  expect(degrees).toBeCloseTo(234, 0);
});
test("Pocket Money: ball animation and result match the existing shot simulation", async ({
  page,
}) => {
  let state = initialPool();
  state.cue.vx = Math.cos((-42 * Math.PI) / 180) * 300;
  state.cue.vy = Math.sin((-42 * Math.PI) / 180) * 300;
  let score: number | null = null;
  for (let i = 0; i < 1000 && score === null; i++) {
    const next = stepPool(state, 0.025);
    state = next.state;
    score = next.score;
  }
  await open(page, "Pocket money");
  await ready(page);
  const cue = page.getByTestId("pool-cue"),
    first = await cue.getAttribute("transform");
  await page.getByText("Shoot →", { exact: true }).click();
  await expect.poll(() => cue.getAttribute("transform")).not.toBe(first);
  await expect(
    page.getByText(`${score} points. The damage is done.`, { exact: true }),
  ).toBeVisible({ timeout: 15000 });
});
test("Bullseye Bill: live horizontal crosshair locks, vertical aim fires and impact scores", async ({
  page,
}) => {
  await open(page, "Bullseye bill");
  await ready(page);
  await expect(page.getByTestId("archery-art")).toHaveCSS(
    "position",
    "absolute",
  );
  await expect(page.getByTestId("archery-art")).toBeInViewport();
  const aim = page.getByTestId("aim-crosshair"),
    first = await aim.getAttribute("transform");
  await expect.poll(() => aim.getAttribute("transform")).not.toBe(first);
  await page.getByLabel("Game arena").click();
  await expect(
    page.getByText("Tap to lock up–down & fire", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Game arena").click();
  await expect(page.getByText("Let it fly…", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Ready next arrow →", { exact: true }),
  ).toBeVisible();
});
test("effects audio is event driven, separately mutable and stops playing when muted", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const play = HTMLMediaElement.prototype.play;
    (window as any).__cues = [];
    HTMLMediaElement.prototype.play = function () {
      (window as any).__cues.push(this);
      return play.call(this);
    };
  });
  await open(page, "Price of nice");
  await ready(page);
  await page.getByLabel("Price guess").fill("1000");
  await page.getByText("Lock in guess", { exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(() =>
        (window as any).__cues.some((a: HTMLMediaElement) =>
          a.src.includes("impact"),
        ),
      ),
    )
    .toBe(true);
  await page.getByLabel("Mute sound effects", { exact: true }).last().click();
  await expect
    .poll(() =>
      page.evaluate(() =>
        (window as any).__cues.every((a: HTMLMediaElement) => a.paused),
      ),
    )
    .toBe(true);
});
