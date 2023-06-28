import { Users } from '../fixtures/userStates';
import { OmnichannelAgents } from '../page-objects';
import { test, expect } from '../utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('omnichannel-agents', () => {
	let poOmnichannelAgents: OmnichannelAgents;

	test.beforeEach(async ({ page }) => {
		poOmnichannelAgents = new OmnichannelAgents(page);

		await page.goto('/omnichannel');
		await poOmnichannelAgents.sidenav.linkAgents.click();
	});

	test('expect add "user1" as agent', async ({ page }) => {
		await poOmnichannelAgents.inputUsername.type('user1');
		await page.locator('role=option[name="user1"]').click();
		await poOmnichannelAgents.btnAdd.click();

		await poOmnichannelAgents.inputSearch.fill('user1');
		await expect(poOmnichannelAgents.firstRowInTable).toBeVisible();
	});

	test('expect update "user1" status', async ({ page }) => {
		await poOmnichannelAgents.inputSearch.fill('user1');
		await poOmnichannelAgents.firstRowInTable.click();

		await poOmnichannelAgents.btnEdit.click();
		await poOmnichannelAgents.btnStatus.click();
		await page.locator(`.rcx-option__content:has-text("Not available")`).click();
		await poOmnichannelAgents.btnSave.click();
	});

	test('expect remove "user1" as agent', async () => {
		await poOmnichannelAgents.inputSearch.fill('user1');
		await poOmnichannelAgents.btnDeletefirstRowInTable.click();
		await poOmnichannelAgents.btnModalRemove.click();

		await poOmnichannelAgents.inputSearch.fill('user1');
		await expect(poOmnichannelAgents.firstRowInTable).toBeHidden();
	});
});
