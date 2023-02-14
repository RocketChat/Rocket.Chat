import { test, expect } from './utils/test';
import { OmnichannelAgents } from './page-objects';

test.use({ storageState: 'admin-session.json' });

test.describe.serial('omnichannel-agents', () => {
	let poOmnichannelAgents: OmnichannelAgents;

	test.beforeEach(async ({ page }) => {
		poOmnichannelAgents = new OmnichannelAgents(page);

		await page.goto('/omnichannel');
		await poOmnichannelAgents.sidenav.linkAgents.click();
	});

	test('expect add "user1" as agent', async ({ page }) => {
		await poOmnichannelAgents.inputUsername.type('user1', { delay: 1000 });
		await page.keyboard.press('Enter');
		await poOmnichannelAgents.btnAdd.click();

		await poOmnichannelAgents.inputSearch.fill('user1');
		expect(poOmnichannelAgents.firstRowInTable).toBeVisible();
	});

	test('expect update "user1" status', async ({ page }) => {
		await poOmnichannelAgents.inputSearch.fill('user1');
		await poOmnichannelAgents.firstRowInTable.click();

		await poOmnichannelAgents.btnEdit.click();
		await poOmnichannelAgents.btnStatus.click();
		await page.locator(`div.rcx-options[role="listbox"] div.rcx-box ol[role="listbox"] li[value="not-available"]`).click();
		await poOmnichannelAgents.btnSave.click();
	});

	test('expect remove "user1" as agent', async () => {
		await poOmnichannelAgents.inputSearch.fill('user1');
		await poOmnichannelAgents.btnDeletefirstRowInTable.click();
		await poOmnichannelAgents.btnModalRemove.click();

		await poOmnichannelAgents.inputSearch.fill('user1');
		expect(poOmnichannelAgents.firstRowInTable).toBeHidden();
	});
});
