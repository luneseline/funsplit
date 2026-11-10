import { expect, test } from "@playwright/test";

test("cold launch intro finishes once and does not replay during navigation", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByLabel("Skip opening animation")).toBeVisible();
  await expect(page.getByText("Big decisions.")).toBeVisible({ timeout: 5000 });
  await expect(page.getByLabel("Skip opening animation")).not.toBeVisible();
  await page.getByText("The crew", { exact: true }).click();
  await page.getByText("Arcade", { exact: true }).click();
  await expect(page.getByLabel("Skip opening animation")).not.toBeVisible();
});

test("Yapathon rotates every player, uses manual call-outs, and requests no microphone", async ({
  page,
}) => {
  test.setTimeout(30000);
  await page.addInitScript(() => {
    (window as any).__micCalls = 0;
    if (navigator.mediaDevices)
      navigator.mediaDevices.getUserMedia = async () => {
        (window as any).__micCalls++;
        throw new Error("microphone must not be used");
      };
  });
  await page.goto("/");
  await page.getByText("Yapathon", { exact: true }).click();
  await page.getByText("Game faces on →", { exact: true }).click();
  await page.getByText("START YAPPING →", { exact: true }).click();
  await page.getByText("Lock topic · start prep →", { exact: true }).click();
  await expect(page.getByLabel("They stopped")).toBeVisible({ timeout: 5000 });
  await page.getByLabel("They stopped").click();
  await page.getByText("Pass to Bestie →", { exact: true }).click();
  await page.getByText("Lock topic · start prep →", { exact: true }).click();
  await expect(page.getByLabel("They stopped")).toBeVisible({ timeout: 5000 });
  await page.getByLabel("They stopped").click();
  await page.getByText("See final scoreboard →", { exact: true }).click();
  await expect(page.getByText("THE YAP REPORT", { exact: true })).toBeVisible();
  await page.getByText("Save round results →", { exact: true }).click();
  await expect(page.getByText(/pay up\./)).toBeVisible();
  expect(await page.evaluate(() => (window as any).__micCalls)).toBe(0);
});
