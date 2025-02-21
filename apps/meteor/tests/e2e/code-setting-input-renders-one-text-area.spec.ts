import { Users } from './fixtures/userStates';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('code-setting-input-renders-one-text-area', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/admin/settings/Message');
	});

	test('renders exactly one CodeMirror element', async ({ page }) => {
		const textarea = page.locator('#Message_CustomFields ~ .CodeMirror');
		await expect(textarea).toHaveCount(1);
	});
});
