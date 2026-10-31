import { test, expect } from "@playwright/test";

const testEmail = process.env.PLAYWRIGHT_TEST_EMAIL;
const testPassword = process.env.PLAYWRIGHT_TEST_PASSWORD;

test.use({
  baseURL: "http://localhost:3000",
  viewport: { width: 1440, height: 1000 },
});

test("public pages render without demo artifacts", async ({ page }) => {
  const consoleErrors = [];
  const pageErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.getByText(/Noir Ledger/i).first()).toBeVisible();
  await expect(page.getByText(/демо/i)).toHaveCount(0);

  await page.goto("/login", { waitUntil: "networkidle" });
  await expect(page.getByRole("button", { name: /войти/i })).toBeVisible();
  await expect(page.getByText(/демо/i)).toHaveCount(0);

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test("authenticated flow works with provided credentials", async ({ page }) => {
  test.skip(!testEmail || !testPassword, "Set PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD to run auth smoke.");

  await page.goto("/login", { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill(testEmail);
  await page.getByLabel("Пароль").fill(testPassword);
  await page.getByRole("button", { name: /^Войти$/ }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.locator('a[href="/transactions"]').first().click();
  await expect(page).toHaveURL(/\/transactions$/);
  await page.getByRole("button", { name: /добавить операцию/i }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator("[data-nextjs-dialog]")).toHaveCount(0);
  await page.keyboard.press("Escape");

  await page.locator('a[href="/goals"]').first().click();
  await expect(page).toHaveURL(/\/goals$/);
  await page.getByRole("button", { name: /добавить цель/i }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator("[data-nextjs-dialog]")).toHaveCount(0);
  await page.keyboard.press("Escape");

  await page.locator('a[href="/settings"]').first().click();
  await expect(page).toHaveURL(/\/settings$/);
  await expect(page.getByRole("button", { name: /сохранить настройки/i })).toBeVisible();
});
