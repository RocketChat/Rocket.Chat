import { faker } from '@faker-js/faker';
import type { Browser, Page } from '@playwright/test';

import { test, expect } from './utils/test';
import { OmnichannelLiveChat, HomeOmnichannel } from './page-objects';

const createAuxContext = async (browser: Browser, storageState: string): Promise<{ page: Page; poHomeOmnichannel: HomeOmnichannel }> => {
	const page = await browser.newPage({ storageState });
	const poHomeOmnichannel = new HomeOmnichannel(page);
	await page.goto('/omnichannel/triggers');
	await page.locator('.main-content').waitFor();

	return { page, poHomeOmnichannel };
};

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
		await api.post('/livechat/users/agent', { username: 'user1' });
		await api.post('/livechat/users/manager', { username: 'user1' });
		agent = await createAuxContext(browser, 'user1-session.json');
	});

	test.beforeEach(async ({ page }) => {
		poLiveChat = new OmnichannelLiveChat(page);
	});

	test.afterAll(async ({ api }) => {
		await api.delete('/livechat/users/agent/user1');
		await api.delete('/livechat/users/manager/user1');
	});

	test('expect create new trigger', async () => {
		await agent.poHomeOmnichannel.triggers.createTrigger(triggersName, triggerMessage);
		await expect(agent.poHomeOmnichannel.triggers.toastMessage).toBeVisible();
	});

	test('expect update trigger', async () => {
		const newTriggerName = `edited-${triggersName}`;
		await agent.poHomeOmnichannel.triggers.firstRowInTriggerTable(triggersName).click();
		await agent.poHomeOmnichannel.triggers.updateTrigger(newTriggerName);
		await expect(agent.poHomeOmnichannel.triggers.toastMessage).toBeVisible();
	});

	test('expect triggers to be displaye on Livechat', async ({ page }) => {
		await test.step('Expect send a message as a visitor', async () => {
			await page.goto('/livechat');
			await poLiveChat.btnOpenLiveChat('R').click();
			await poLiveChat.startNewChat(newUser, false);
			await expect(page.locator(`text=${triggerMessage} >> nth=0`)).toBeVisible();
		});
	});
	test('expect deleting trigger', async () => {
		await agent.poHomeOmnichannel.triggers.btnDeletefirstRowInTable.click();
		await agent.poHomeOmnichannel.triggers.btnModalRemove.click();
		await expect(agent.poHomeOmnichannel.triggers.removeToastMessage).toBeVisible();
	});
});
