import { faker } from '@faker-js/faker';
import type { Page } from '@playwright/test';

import { createAuxContext } from './fixtures/createAuxContext';
import { Users } from './fixtures/userStates';
import { OmnichannelLiveChat, HomeOmnichannel } from './page-objects';
import { test, expect } from './utils/test';

test.describe.serial('omnichannel-triggers', () => {
	let triggersName: string;
	let triggerMessage: string;
	let poLiveChat: OmnichannelLiveChat;
	let newUser: { email: string; name: string };
	let agent: { page: Page; poHomeOmnichannel: HomeOmnichannel };

	test.beforeAll(async ({ api, browser }) => {
		newUser = {
			name: faker.name.firstName(),
			email: faker.internet.email(),
		};
		triggersName = faker.datatype.uuid();
		triggerMessage = 'Welcome to Rocket.chat';
		await Promise.all([
			api.post('/livechat/users/agent', { username: 'user1' }),
			api.post('/livechat/users/manager', { username: 'user1' }),
		]);

		const { page } = await createAuxContext(browser, Users.user1);
		agent = { page, poHomeOmnichannel: new HomeOmnichannel(page) };

		await page.goto('/omnichannel/triggers');
		await page.locator('.main-content').waitFor();
	});

	test.beforeEach(async ({ page }) => {
		poLiveChat = new OmnichannelLiveChat(page);
	});

	test.afterAll(async ({ api }) => {
		await Promise.all([api.delete('/livechat/users/agent/user1'), api.delete('/livechat/users/manager/user1')]);
		await agent.page.close();
	});

	test('Triggers', async ({ page }) => {
		await test.step('expect create new trigger', async () => {
			await agent.poHomeOmnichannel.triggers.createTrigger(triggersName, triggerMessage);
			await expect(agent.poHomeOmnichannel.triggers.toastMessage).toBeVisible();
		});
		await test.step('expect update trigger', async () => {
			const newTriggerName = `edited-${triggersName}`;
			await agent.poHomeOmnichannel.triggers.firstRowInTriggerTable(triggersName).click();
			await agent.poHomeOmnichannel.triggers.updateTrigger(newTriggerName);
			await expect(agent.poHomeOmnichannel.triggers.toastMessage).toBeVisible();
		});
		await test.step('expect triggers to be displaye on Livechat', async () => {
			await test.step('Expect send a message as a visitor', async () => {
				await page.goto('/livechat');
				await poLiveChat.btnOpenLiveChat('R').click();
				if (await page.locator('[type="button"] >> text="Chat now"').isVisible()) {
					await page.locator('[type="button"] >> text="Chat now"').click();
				}
				await poLiveChat.sendMessage(newUser, false);
				await expect(page.locator(`text=${triggerMessage} >> nth=0`)).toBeVisible();
				await page.goBack();
			});
		});
		await test.step('expect deleting trigger', async () => {
			await agent.poHomeOmnichannel.triggers.btnDeletefirstRowInTable.click();
			await agent.poHomeOmnichannel.triggers.btnModalRemove.click();
			await expect(agent.poHomeOmnichannel.triggers.removeToastMessage).toBeVisible();
		});
	});
});
