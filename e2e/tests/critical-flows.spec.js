// @ts-check
const { test, expect } = require('@playwright/test');

// Critical flows from the SRS (section "Critical flows").
// Seed users (server/seed.js) all use the password Test1234; the specialist
// Zeynep is linked to the child Ali in the seed data.
const PASSWORD = 'Test1234';

async function logIn(page, email) {
  await page.goto('/');
  await page.getByLabel('E-posta').fill(email);
  await page.getByLabel('Şifre').fill(PASSWORD);
  await page.getByRole('button', { name: 'Giriş yap' }).click();
}

async function logOut(page) {
  await page.getByRole('button', { name: 'Çıkış yap' }).click();
  await expect(page.getByRole('button', { name: 'Giriş yap' })).toBeVisible();
}

// Today as YYYY-MM-DD in local time, so the task is due in the current week.
function todayIso() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

test('Flow 1: a specialist assigns a task, the child completes it and the specialist sees it done', async ({ page }) => {
  const title = 'Read a picture book together';

  // The linked specialist assigns the task (FR-M4-01).
  await logIn(page, 'zeynep@test.com');
  await expect(page.getByRole('heading', { name: 'Uzman ekranı' })).toBeVisible();
  const form = page.getByRole('form', { name: 'Görev ata' });
  await form.getByLabel('Görev başlığı').fill(title);
  await form.getByLabel('Gelişim alanı').selectOption('language');
  await form.getByLabel('Son tarih').fill(todayIso());
  await form.getByRole('button', { name: 'Görevi ata' }).click();
  const assigned = page.getByRole('listitem').filter({ hasText: title });
  await expect(assigned.getByText('Bekliyor')).toBeVisible();
  await logOut(page);

  // The child sees the task in their list and marks it done (FR-M4-02, FR-M4-03).
  await logIn(page, 'ali@test.com');
  await expect(page.getByRole('heading', { name: 'Çocuk ekranı' })).toBeVisible();
  const childTask = page.getByRole('listitem').filter({ hasText: title });
  await childTask.getByRole('button', { name: 'Tamamladım' }).click();
  await expect(childTask.getByText('Tamamlandı')).toBeVisible();
  await logOut(page);

  // The specialist sees the task as done (FR-M4-04).
  await logIn(page, 'zeynep@test.com');
  await expect(page.getByRole('listitem').filter({ hasText: title }).getByText('Tamamlandı')).toBeVisible();
});
