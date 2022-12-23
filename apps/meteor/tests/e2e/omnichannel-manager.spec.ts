import { test, expect } from './utils/test';
import { OmnichannelManager } from './page-objects';

test.use({ storageState: 'admin-session.json' });

test.describe.serial('omnichannel-manager', () => {
	const user1 = 'user1';
	let poOmnichannelManagers: OmnichannelManager;

	test.beforeEach(async ({ page }) => {
		poOmnichannelManagers = new OmnichannelManager(page);

		await page.goto('/omnichannel');
		await poOmnichannelManagers.sidenav.linkManagers.click();
	});

	test('expect add "user1" as manager', async ({ page }) => {
		await poOmnichannelManagers.inputUsername.type(user1, { delay: 1000 });
		await page.keyboard.press('Enter');
		await poOmnichannelManagers.btnAdd.click();

		await expect(poOmnichannelManagers.firstRowInTable(user1)).toBeVisible();
	});

	test('expect remove "user1" as manager', async () => {
		await poOmnichannelManagers.btnDeleteFirstRowInTable.click();
		await poOmnichannelManagers.btnModalRemove.click();

		await expect(poOmnichannelManagers.firstRowInTable(user1)).toBeHidden();
	});
});
