import type { Browser, Page } from '@playwright/test';
import faker from '@faker-js/faker';

import { test, expect } from './utils/test';
import { OmnichannelAgents, OmnichannelLiveChat } from './page-objects';
import { IS_EE } from './config/constants';

const createAuxContext = async (browser: Browser, sessionName?: string): Promise<{ page: Page; poOmnichannelLiveChat: OmnichannelLiveChat }> => {
	const page = await browser.newPage({ storageState: sessionName });
	const poOmnichannelLiveChat = new OmnichannelLiveChat(page);
	await page.goto('/livechat');
	return { page, poOmnichannelLiveChat };
};

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

	test.describe.only('Verify the max number of simultaneous chats addressed by an agent', () => {
		test.skip(!IS_EE, 'Enterprise only');

		test('expect add "user1" as agent and set max number chats to 1', async ({ page }) => {
			await poOmnichannelAgents.inputUsername.type('user1', { delay: 1000 });
			await page.keyboard.press('Enter');
			await poOmnichannelAgents.btnAdd.click();

			await poOmnichannelAgents.inputSearch.fill('user1');
			await poOmnichannelAgents.firstRowInTable.click();
			await poOmnichannelAgents.btnEdit.click();
			await poOmnichannelAgents.inputMaxChats.fill('1');
			await poOmnichannelAgents.btnSave.click();
		});

		test('expect enable await queue', async ({ page }) => {
			await page.goto('/admin/settings/Omnichannel');
			await page.locator('text=Queue Management').click();
			await page
				.locator('text=Waiting queue message❰Message that will be displayed to the visitors when they g >> input[type="text"]')
				.fill('please await');
			await page.locator('text=Waiting queue❰ >> i').first().click();
			await page.locator('text=Save changes').click();
			await page.close();
		});

		test.describe('expect open one client and put new clients on hold ', () => {
			let poAuxContext1: { page: Page; poOmnichannelLiveChat: OmnichannelLiveChat };
			let poAuxContext2: { page: Page; poOmnichannelLiveChat: OmnichannelLiveChat };
			let poAuxContext3: { page: Page; poOmnichannelLiveChat: OmnichannelLiveChat };

			test.beforeAll(async ({ browser }) => {
				poAuxContext1 = await createAuxContext(browser, 'user1-session.json');
				poAuxContext2 = await createAuxContext(browser);
				poAuxContext3 = await createAuxContext(browser);
			});

			test('send message from livechat', async () => {
				await poAuxContext1.page.goto('/home');

				await poAuxContext2.poOmnichannelLiveChat.btnOpenLiveChat('R').click();
				await poAuxContext2.poOmnichannelLiveChat.sendMessage({ email: faker.internet.email(), name: faker.internet.userName() });
				
				await poAuxContext3.poOmnichannelLiveChat.btnOpenLiveChat('R').click();
				await poAuxContext3.poOmnichannelLiveChat.sendMessage({ email: faker.internet.email(), name: faker.internet.userName() });
				
				await poAuxContext1.page.close();
				await poAuxContext2.page.close();
				await poAuxContext3.page.close();
			});
		});
	});
});
