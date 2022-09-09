import type { Page, Browser } from '@playwright/test';
import faker from '@faker-js/faker';

import { test } from './utils/test';
import { OmnichannelLiveChat, OmnichannelAgents, HomeChannel } from './page-objects';
import { IS_EE } from './config/constants';

async function createAuxContext(browser: Browser): Promise<{ page: Page; poLiveChat: OmnichannelLiveChat }> {
	const page = await browser.newPage();
	const poLiveChat = new OmnichannelLiveChat(page);

	return { page, poLiveChat };
}

test.skip(!IS_EE, 'Enterprise only');

test.use({ storageState: 'admin-session.json' });

test.describe.only('Livechat Management', () => {
	let poAgents: OmnichannelAgents;
	let poHomeChannel: HomeChannel;

	test.beforeAll(() => {
		// drop pending chats
	});

	test.beforeEach(({ page }) => {
		poAgents = new OmnichannelAgents(page);
		poHomeChannel = new HomeChannel(page);
	});

	test.describe.serial('Verify the max number of simultaneous chats addressed by an agent', () => {
		test('shoud setup the await-queue and the agent', async ({ page }) => {
			await test.step('remove "user1" if its already a agent', async () => {
				await page.goto('/omnichannel/agents');
				await poAgents.inputSearch.fill('user1');

				if (await poAgents.btnDeletefirstRowInTable.isVisible()) {
					await poAgents.btnDeletefirstRowInTable.click();
					await poAgents.btnModalRemove.click();
				}
			});

			await test.step('add "user1" as a agent', async () => {
				await poAgents.inputUsername.type('user1', { delay: 1000 });
				await page.keyboard.press('Enter');
				await poAgents.btnAdd.click();
			});

			await test.step('set max chats to 1', async () => {
				await poAgents.inputSearch.fill('user1');
				await poAgents.firstRowInTable.click();
				await poAgents.btnEdit.click();
				await poAgents.inputMaxChats.fill('1');
				await poAgents.btnSave.click();
			});

			await test.step('enable await-queue', async () => {
				await page.goto('/admin/settings/Omnichannel');
				await page.locator('text=Queue Management').click();

				// Only if checkbox is not checked
				if (!(await page.locator('[data-qa-setting-id="Livechat_waiting_queue"] input').inputValue())) {
					await page.locator('[data-qa-setting-id="Livechat_waiting_queue"]').click();
				}

				await page.locator('[data-qa-setting-id="Livechat_waiting_queue_message"]').type(`Please await :) ${Date.now()}`);
				await page.locator('text=Save changes').click();
			});
		});

		test.describe('expect open one client and put new clients on hold ', () => {
			test.use({ storageState: 'user1-session.json' });

			test('should open chat with one visitor and put any new one on hold', async ({ page, browser }) => {
				const visitor1 = { email: faker.internet.email(), name: faker.name.findName() };
				const visitor2 = { email: faker.internet.email(), name: faker.name.findName() };

				let poAuxContext1: { page: Page; poLiveChat: OmnichannelLiveChat };
				let poAuxContext2: { page: Page; poLiveChat: OmnichannelLiveChat };

				await test.step('"user1" goto /home and two visitors open /livechat', async () => {
					await page.goto('/home');

					poAuxContext1 = await createAuxContext(browser);
					await poAuxContext1.page.goto('/livechat');

					poAuxContext2 = await createAuxContext(browser);
					await poAuxContext2.page.goto('/livechat');
				});

				await test.step('visitors send message in /livechat', async () => {
					await poAuxContext1.poLiveChat.btnOpenLiveChat('L').click();
					await poAuxContext1.poLiveChat.sendMessage(visitor1);

					await poAuxContext2.poLiveChat.btnOpenLiveChat('L').click();
					await poAuxContext2.poLiveChat.sendMessage(visitor2);
				});

				await test.step('"user1" reply in "visitor1" chat', async () => {
					await poHomeChannel.sidenav.openChat(visitor1.name);
					await poHomeChannel.content.sendMessage('hello');
				});

				await test.step('"visitor2" must be on a queue', async () => {
					//
				});
			});
		});
	});
});
