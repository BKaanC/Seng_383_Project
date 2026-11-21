// @ts-check
const { test, expect } = require('@playwright/test');

// Seed users (server/seed.js) all use the password Test1234.
const PASSWORD = 'Test1234';

async function logIn(page, email, password = PASSWORD) {
  await page.goto('/');
  await page.getByLabel('E-posta').fill(email);
  await page.getByLabel('Şifre').fill(password);
  await page.getByRole('button', { name: 'Giriş yap' }).click();
}

test.describe('M1 login and M3 weekly schedule', () => {
  test('a child logs in and sees their own weekly schedule', async ({ page }) => {
    await logIn(page, 'ali@test.com');

    await expect(page.getByRole('heading', { name: 'Çocuk ekranı' })).toBeVisible();
    await expect(page.getByText('Hoş geldin, Ali Demir.')).toBeVisible();
    await expect(page.getByText('Speech therapy session')).toBeVisible();
    await expect(page.getByText('Reading time')).toBeVisible();
  });

  test('a parent logs in and sees the parent screen', async ({ page }) => {
    await logIn(page, 'ayse@test.com');

    await expect(page.getByRole('heading', { name: 'Ebeveyn ekranı' })).toBeVisible();
    await expect(page.getByText('Speech therapy session')).toBeVisible();
  });

  test('a wrong password shows an error and stays on the login form', async ({ page }) => {
    await logIn(page, 'ali@test.com', 'wrong-password');

    await expect(page.getByRole('alert')).toHaveText('Invalid email or password');
    await expect(page.getByRole('heading', { name: 'Giriş yap' })).toBeVisible();
  });
});
