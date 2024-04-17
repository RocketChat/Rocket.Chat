import { Users } from '../fixtures/userStates';
import { OmnichannelManager } from '../page-objects';
import { test, expect } from '../utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('omnichannel-manager', () => {
	let poOmnichannelManagers: OmnichannelManager;

	test.beforeEach(async ({ page }) => {
		poOmnichannelManagers = new OmnichannelManager(page);

		await page.goto('/omnichannel');
		await poOmnichannelManagers.sidenav.linkManagers.click();
	});

	test('OC - Manage Managers - Add, Search and Remove', async ({ page }) => {
		await test.step('expect "user1" be first ', async () => {
			await poOmnichannelManagers.inputUsername.fill('user');
			await expect(page.locator('role=option[name="user1"]')).toContainText('user1');
		});

		await test.step('expect add "user1" as manager', async () => {
			await poOmnichannelManagers.selectUsername('user1');
			await poOmnichannelManagers.btnAdd.click();

			await expect(poOmnichannelManagers.findRowByName('user1')).toBeVisible();
		});

		await test.step('expect search for manager', async () => {
			await poOmnichannelManagers.search('user1');
			await expect(poOmnichannelManagers.findRowByName('user1')).toBeVisible();

			await poOmnichannelManagers.search('NonExistingUser');
			await expect(poOmnichannelManagers.findRowByName('user1')).toBeHidden();

			await poOmnichannelManagers.clearSearch();
		});

		await test.step('expect remove "user1" as manager', async () => {
			await poOmnichannelManagers.search('user1');
			await poOmnichannelManagers.btnDeleteSelectedAgent('user1').click();
			await poOmnichannelManagers.btnModalRemove.click();

			await expect(poOmnichannelManagers.findRowByName('user1')).toBeHidden();
		});
	});
});
