import { Users } from '../fixtures/userStates';
import { OmnichannelAgents } from '../page-objects';
import { test, expect } from '../utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('omnichannel-agents', () => {
	let poOmnichannelAgents: OmnichannelAgents;

	test.beforeAll(async ({ page, api }) => {
		await api.post('/users.setStatus', { status: 'online', username: 'user2' }).then((res) => expect(res.status()).toBe(200));
		poOmnichannelAgents = new OmnichannelAgents(page);
		await page.goto('/omnichannel');
		await poOmnichannelAgents.sidenav.linkAgents.click();
	});

	test('expect add "user2" as agent', async ({ page }) => {
		await poOmnichannelAgents.inputUsername.type('user2');
		await page.locator('role=option[name="user2"]').click();
		await poOmnichannelAgents.btnAdd.click();

		await poOmnichannelAgents.inputSearch.fill('user2');
		await expect(poOmnichannelAgents.firstRowInTable).toBeVisible();
	});

	test('expect update "user2" status', async ({ page }) => {
		await poOmnichannelAgents.inputSearch.fill('user2');
		await poOmnichannelAgents.firstRowInTable.click();

		await poOmnichannelAgents.btnEdit.click();
		await poOmnichannelAgents.btnStatus.click();
		await page.locator(`.rcx-option__content:has-text("Not available")`).click();
		await poOmnichannelAgents.btnSave.click();
	});

	test('expect remove "user2" as agent', async () => {
		await poOmnichannelAgents.inputSearch.fill('user2');
		await poOmnichannelAgents.btnDeletefirstRowInTable.click();
		await poOmnichannelAgents.btnModalRemove.click();

		await poOmnichannelAgents.inputSearch.fill('user2');
		await expect(poOmnichannelAgents.firstRowInTable).toBeHidden();
	});
});
