import { test, expect, devices } from "@playwright/test";

const testEmail = process.env.PLAYWRIGHT_TEST_EMAIL;
const testPassword = process.env.PLAYWRIGHT_TEST_PASSWORD;

test.use({
  ...devices["iPhone 13"],
  baseURL: "http://localhost:3000",
});

test("mobile auth screen stays clean", async ({ page }) => {
  await page.goto("/login", { waitUntil: "networkidle" });
  await expect(page.getByText(/Noir Ledger/i).last()).toBeVisible();
  await expect(page.getByText(/демо/i)).toHaveCount(0);
  await expect(page.getByRole("button", { name: /войти/i })).toBeVisible();
});

test("mobile dock and dialogs work with provided credentials", async ({ page }) => {
  test.skip(!testEmail || !testPassword, "Set PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD to run mobile auth smoke.");

  await page.goto("/login", { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill(testEmail);
  await page.getByLabel("Пароль").fill(testPassword);
  await page.getByRole("button", { name: /^Войти$/ }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.locator('a[href="/transactions"]').last().click();
  await expect(page).toHaveURL(/\/transactions$/);
  await page.getByRole("button", { name: /добавить операцию/i }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");

  await page.locator('a[href="/goals"]').last().click();
  await expect(page).toHaveURL(/\/goals$/);
  await page.getByRole("button", { name: /добавить цель/i }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");

  await page.locator('a[href="/insights"]').last().click();
  await expect(page).toHaveURL(/\/insights$/);
  await expect(page.getByRole("button", { name: /отправить вопрос/i })).toBeVisible();
});
