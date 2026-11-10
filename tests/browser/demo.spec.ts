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
  await page.getByLabel("Price guess").fill("1000");
  await page.getByText("Lock in guess", { exact: true }).click();
  await page.getByText("Save score & pass it on →", { exact: true }).click();
  await expect(page.getByText("Sam, you’re up.")).toBeVisible();
  await page.getByText("I’m ready. Let’s play →", { exact: true }).click();
  await page.getByLabel("Price guess").fill("3200");
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
    "Tap tap, broke",
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
        title === "Wheel of owe" ? "Spin my fate ↻" : "I’m ready. Let’s play →",
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
    "Tap tap, broke",
    "Snack flight",
    "Wheel of owe",
    "Pocket money",
    "Bullseye bill",
  ]) {
    await page.getByText(title, { exact: true }).click();
    await page.getByText("Game faces on →", { exact: true }).click();
    await page
      .getByText(
        title === "Wheel of owe" ? "Spin my fate ↻" : "I’m ready. Let’s play →",
        { exact: true },
      )
      .click();
    if (title === "Bullseye bill")
      for (let i = 0; i < 3; i++) await page.getByLabel("Game arena").click();
    if (title === "Pocket money")
      await page.getByText("Shoot →", { exact: true }).click();
    if (title === "Tap tap, broke")
      for (let i = 0; i < 8; i++) await page.getByLabel("Game arena").click();
    if (title === "Stack attack")
      for (let i = 0; i < 3; i++) await page.getByLabel("Game arena").click();
    await expect(
      page.getByText("Save score & pass it on →", { exact: true }),
    ).toBeVisible({ timeout: 25000 });
    await page.getByText("Save score & pass it on →", { exact: true }).click();
    await expect(page.getByText("Bestie, you’re up.")).toBeVisible();
    await page.getByLabel("Close dialog").click();
  }
});
