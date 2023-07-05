import { expect, test as setup } from '@playwright/test';
import { login } from '../support/users/user';

const authFile = 'playwright/.auth/admin.json';

setup('authenticate', async ({ page }) => {
await login(page);
await expect(page.getByRole('heading', { name: 'Home' }).last()).toBeVisible({ timeout: 10000 });
await page.context().storageState({ path: authFile });
});
