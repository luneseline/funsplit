import { test, expect } from "@playwright/test";
test("arcade, custom crew, two-player price round, payment persistence", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByText("Big decisions.")).toBeVisible();
  for (const title of [
    "Stack attack",
    "Tap tap, broke",
    "Price of nice",
    "Snack flight",
    "Wheel of owe",
    "Yapathon",
    "Pocket money",
    "Bullseye bill",
  ])
    await expect(page.getByText(title, { exact: true })).toBeVisible();
  await page.getByText("The crew", { exact: true }).click();
  await page.getByLabel("Player 1 name").fill("Alex");
  await page.getByLabel("Player 2 name").fill("Sam");
  await page.getByText("Arcade", { exact: true }).click();
  await page.getByText("Price of nice", { exact: true }).click();
  await page.getByText("Game faces on →", { exact: true }).click();
  await page.getByText("I’m ready. Let’s play →", { exact: true }).click();
  await page.getByLabel("Price guess").fill("100000");
  await page.getByText("Lock in guess", { exact: true }).click();
  await page.getByText("Save score & pass it on →", { exact: true }).click();
  await expect(page.getByText("Sam, you’re up.")).toBeVisible();
  await page.getByText("I’m ready. Let’s play →", { exact: true }).click();
  await page.getByLabel("Price guess").fill("0");
  await page.getByText("Lock in guess", { exact: true }).click();
  await page.getByText("Save score & pass it on →", { exact: true }).click();
  await expect(page.getByText("Alex, pay up.")).toBeVisible();
  await page.getByText("Confirm Alex paid ✓", { exact: true }).click();
  await expect(
    page.getByText("✓ Payment added to this device’s Hall of shame."),
  ).toBeVisible();
  await page.getByText("Back to arcade", { exact: true }).click();
  await page.getByText("Hall of shame", { exact: true }).click();
  await expect(page.getByText("1 paid", { exact: true })).toBeVisible();
  await page.reload();
  await page.getByText("Hall of shame", { exact: true }).click();
  await expect(page.getByText("1 paid", { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
test("phone viewport and all non-price game arenas open", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  for (const title of [
    "Stack attack",
    "Snack flight",
    "Wheel of owe",
    "Pocket money",
    "Bullseye bill",
  ]) {
    await page.getByText(title, { exact: true }).click();
    await page.getByText("Game faces on →", { exact: true }).click();
    await page.getByText(title, { exact: true }).last().waitFor();
    await page
      .getByText(
        title === "Wheel of owe"
          ? "SPIN THE WHEEL ↻"
          : "I’m ready. Let’s play →",
        { exact: true },
      )
      .click();
    await expect(page.getByLabel("Game arena")).toBeVisible();
    await page.getByLabel("Close dialog").click();
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("choice setup and screens-down honesty check-ins", async ({ page }) => {
  await page.goto("/");
  await page.getByText("Let’s settle it →", { exact: true }).click();
  await page.getByText("Where to eat", { exact: true }).click();
  await expect(page.getByLabel("Decision choices")).toHaveValue(
    "Pizza\nSushi\nTacos",
  );
  await page.getByLabel("Close dialog").click();
  await page.getByText("Screens down.").click();
  await expect(page.getByText("SCREENS DOWN · HONESTY DEMO")).toBeVisible();
  await page.getByText("Start hangout", { exact: true }).click();
  await page.getByText("+30s", { exact: true }).first().click();
  await page.getByText("End hangout →", { exact: true }).click();
  await expect(page.getByText("You checked out the most.")).toBeVisible();
});
test("every arcade game can finish and hand off a score", async ({ page }) => {
  test.setTimeout(120000);
  await page.goto("/");
  for (const title of [
    "Stack attack",
    "Snack flight",
    "Pocket money",
    "Bullseye bill",
  ]) {
    await page.getByText(title, { exact: true }).click();
    await page.getByText("Game faces on →", { exact: true }).click();
    await page.getByText("I’m ready. Let’s play →", { exact: true }).click();
    if (title === "Bullseye bill")
      for (let i = 0; i < 3; i++) {
        await page.getByLabel("Game arena").click();
        await page.getByLabel("Game arena").click();
        await page
          .getByText(
            i < 2 ? "Ready next arrow →" : "Save score & pass it on →",
            { exact: true },
          )
          .waitFor();
        if (i < 2)
          await page.getByText("Ready next arrow →", { exact: true }).click();
      }
    if (title === "Pocket money")
      await page.getByText("Shoot →", { exact: true }).click();
    if (title === "Tap tap, broke")
      for (let i = 0; i < 8; i++) await page.getByLabel("Game arena").click();
    if (title === "Stack attack")
      for (let i = 0; i < 3; i++) await page.getByLabel("Game arena").click();
    await expect(
      page.getByText("Save score & pass it on →", { exact: true }),
    ).toBeVisible({ timeout: 35000 });
    await page.getByText("Save score & pass it on →", { exact: true }).click();
    await expect(page.getByText("Bestie, you’re up.")).toBeVisible();
    await page.getByLabel("Close dialog").click();
  }
});
test("same-screen race accepts two simultaneous fingers and completes the bracket", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByText("Tap tap, broke", { exact: true }).click();
  await page.getByText("Game faces on →", { exact: true }).click();
  await page.getByText("Start this heat →", { exact: true }).click();
  const left = page.getByLabel("Tap for You"),
    right = page.getByLabel("Tap for Bestie");
  await expect(left).toBeVisible();
  await expect(page.getByText("20.0s", { exact: true })).not.toBeVisible({
    timeout: 5000,
  });
  await page.waitForTimeout(2200);
  const a = (await left.boundingBox())!,
    b = (await right.boundingBox())!;
  expect(a.y + a.height).toBeLessThan(845);
  expect(b.y + b.height).toBeLessThan(845);
  const cdp = await context.newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { x: a.x + a.width / 2, y: a.y + a.height / 2, id: 1 },
      { x: b.x + b.width / 2, y: b.y + b.height / 2, id: 2 },
    ],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect(left.getByText("1", { exact: true })).toBeVisible();
  await expect(right.getByText("1", { exact: true })).toBeVisible();
  for (let i = 1; i < 60; i++)
    await left.dispatchEvent("pointerdown", {
      pointerId: 1,
      pointerType: "touch",
    });
  await expect(page.getByText("Heat winner: You")).toBeVisible();
  await page.getByText("Continue bracket →", { exact: true }).click();
  await expect(page.getByText("Champion: You")).toBeVisible();
  await page.getByText("Save tournament scores →", { exact: true }).click();
  await expect(page.getByText("Bestie, pay up.")).toBeVisible();
  expect(errors).toEqual([]);
  await context.close();
});
test("archery locks horizontal then vertical and times out unshot arrows after 30s", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByText("Bullseye bill", { exact: true }).click();
  await page.getByText("Game faces on →", { exact: true }).click();
  await page.getByText("I’m ready. Let’s play →", { exact: true }).click();
  await expect(page.getByLabel("Shot timer")).toHaveText(/30s/);
  await page.getByLabel("Game arena").click();
  await expect(
    page.getByText("Tap to lock up–down & fire", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Game arena").click();
  await expect(
    page.getByText("Ready next arrow →", { exact: true }),
  ).toBeVisible();
  await page.clock.install();
  await page.getByText("Ready next arrow →", { exact: true }).click();
  await page.clock.fastForward(31000);
  await expect(
    page.getByText("Time’s up! This arrow scores 0.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Shot timer")).toHaveText("0s");
});
test("music plays bundled audio and mute pauses it", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      (window as any).__partyAudio = this;
      return original.call(this);
    };
  });
  await page.goto("/");
  await page.getByLabel("Play music", { exact: true }).click();
  await expect(page.getByLabel("Mute music", { exact: true })).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as any).__partyAudio?.paused === false &&
          (window as any).__partyAudio?.currentTime > 0,
      ),
    )
    .toBe(true);
  await page.getByLabel("Mute music", { exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(() => (window as any).__partyAudio?.paused === true),
    )
    .toBe(true);
});
