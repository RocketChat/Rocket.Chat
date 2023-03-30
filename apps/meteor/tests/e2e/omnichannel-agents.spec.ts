import { Users } from './fixtures/userStates';
import { OmnichannelAgents } from './page-objects';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('omnichannel-agents', () => {
	let poOmnichannelAgents: OmnichannelAgents;

	test.beforeEach(async ({ page }) => {
		poOmnichannelAgents = new OmnichannelAgents(page);

		await page.goto('/omnichannel');
		await poOmnichannelAgents.sidenav.linkAgents.click();
	});

	test('agents', async ({ page }) => {
		await test.step('expect add "user1" as agent', async () => {
			await poOmnichannelAgents.inputUsername.type('user1', { delay: 1000 });
			await page.keyboard.press('Enter');
			await poOmnichannelAgents.btnAdd.click();
	
			await poOmnichannelAgents.inputSearch.fill('user1');
			await expect(poOmnichannelAgents.firstRowInTable('user1')).toBeVisible();
		});

		await test.step('expect update "user1" status', async () => {
			await poOmnichannelAgents.inputSearch.fill('user1');
			await poOmnichannelAgents.firstRowInTable('user1').click();
	
			await poOmnichannelAgents.btnEdit.click();
			await poOmnichannelAgents.btnStatus.click();
			await page.locator(`div.rcx-options[role="listbox"] div.rcx-box ol[role="listbox"] li[value="not-available"]`).click();
			await poOmnichannelAgents.btnSave.click();
		});

		await test.step('expect remove "user1" as agent', async () => {
			await poOmnichannelAgents.inputSearch.fill('');
			await poOmnichannelAgents.inputSearch.type('user1', { delay: 1000 });
			await poOmnichannelAgents.btnDeletefirstRowInTable.click();
			await poOmnichannelAgents.btnModalRemove.click();
	
			await poOmnichannelAgents.inputSearch.type('user1', { delay: 1000 });
			await expect(poOmnichannelAgents.firstRowInTable('user1')).toBeHidden();
		});
	})
});
