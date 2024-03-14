import { faker } from '@faker-js/faker';
import type { Page } from '@playwright/test';

import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { OmnichannelLiveChat, HomeOmnichannel } from '../page-objects';
import { test, expect } from '../utils/test';

test.describe.serial('OC - Livechat Triggers', () => {
	let triggersName: string;
	let triggerMessage: string;
	let poLiveChat: OmnichannelLiveChat;
	let newUser: { email: string; name: string };
	let agent: { page: Page; poHomeOmnichannel: HomeOmnichannel };

	test.beforeAll(async ({ api, browser }) => {
		newUser = {
			name: faker.person.firstName(),
			email: faker.internet.email(),
		};
		triggersName = faker.string.uuid();
		triggerMessage = 'This is a trigger message';
		const requests = await Promise.all([
			api.post('/livechat/users/agent', { username: 'user1' }),
			api.post('/livechat/users/manager', { username: 'user1' }),
			api.post('/settings/Livechat_clear_local_storage_when_chat_ended', { value: true }),
		]);
		requests.every((e) => expect(e.status()).toBe(200));

		const { page } = await createAuxContext(browser, Users.user1, '/omnichannel/triggers');
		agent = { page, poHomeOmnichannel: new HomeOmnichannel(page) };
		await page.emulateMedia({ reducedMotion: 'reduce' });
	});

	test.beforeEach(async ({ page, api }) => {
		poLiveChat = new OmnichannelLiveChat(page, api);
	});

	test.afterAll(async ({ api }) => {
		const ids = (await (await api.get('/livechat/triggers')).json()).triggers.map(
			(trigger: { _id: string }) => trigger._id,
		) as unknown as string[];

		await Promise.all(ids.map((id) => api.delete(`/livechat/triggers/${id}`)));

		await Promise.all([
			api.delete('/livechat/users/agent/user1'),
			api.delete('/livechat/users/manager/user1'),
			api.post('/settings/Livechat_clear_local_storage_when_chat_ended', { value: false }),
		]);
		await agent.page.close();
	});

	test('OC - Livechat Triggers - Baseline', async ({ page }) => {
		await page.goto('/livechat');
		await poLiveChat.openLiveChat();

		await test.step('expect to register visitor', async () => {
			await expect(poLiveChat.btnChatNow).not.toBeVisible();
			await poLiveChat.sendMessage(newUser, false);
		});

		await test.step('expect send a message as a visitor', async () => {
			await poLiveChat.onlineAgentMessage.type('this_a_test_message_from_user');
			await poLiveChat.btnSendMessageToOnlineAgent.click();
			await expect(poLiveChat.txtChatMessage('this_a_test_message_from_user')).toBeVisible();
		});

		await test.step('expect to finish this chat', async () => {
			await poLiveChat.closeChat();
			await expect(poLiveChat.txtHeaderTitle).toBeVisible();
		});
	});

	test('OC - Livechat Triggers - Create and edit trigger', async () => {
		triggerMessage = 'This is a trigger message time on site';
		await test.step('expect create new trigger', async () => {
			await agent.poHomeOmnichannel.triggers.createTrigger(triggersName, triggerMessage, 'time-on-site', 5);
			await agent.poHomeOmnichannel.triggers.btnCloseToastMessage.click();
		});

		triggerMessage = 'This is a trigger message chat opened by visitor';
		await test.step('expect update trigger', async () => {
			await agent.poHomeOmnichannel.triggers.firstRowInTriggerTable(triggersName).click();
			await agent.poHomeOmnichannel.triggers.updateTrigger(triggersName, triggerMessage);
			await agent.poHomeOmnichannel.triggers.btnCloseToastMessage.click();
		});
	});

	test('OC - Livechat Triggers - Condition: chat opened by visitor', async ({ page }) => {
		await test.step('expect to start conversation', async () => {
			await page.goto('/livechat');
			await poLiveChat.openLiveChat();
		});

		await test.step('expect trigger message before registration', async () => {
			await expect(poLiveChat.txtChatMessage(triggerMessage)).toBeVisible();
		});

		await test.step('expect to register visitor', async () => {
			await poLiveChat.btnChatNow.click();
			await poLiveChat.sendMessage(newUser, false);
		});

		await test.step('expect trigger message after registration', async () => {
			await expect(poLiveChat.txtChatMessage(triggerMessage)).not.toBeVisible();
		});

		await test.step('expect send a message as a visitor', async () => {
			await poLiveChat.onlineAgentMessage.type('this_a_test_message_from_user');
			await poLiveChat.btnSendMessageToOnlineAgent.click();
			await expect(poLiveChat.txtChatMessage('this_a_test_message_from_user')).toBeVisible();
		});

		await test.step('expect to finish this chat', async () => {
			await poLiveChat.closeChat();
			await expect(poLiveChat.txtHeaderTitle).toBeVisible();
		});
	});

	test('OC - Livechat Triggers - Condition: after guest registration', async ({ page }) => {

		triggerMessage = 'This is a trigger message after guest registration';
		await test.step('expect update trigger to after guest registration', async () => {
			await agent.poHomeOmnichannel.triggers.firstRowInTriggerTable(`edited-${triggersName}`).click();
			await agent.poHomeOmnichannel.triggers.fillTriggerForm({ condition: 'after-guest-registration', triggerMessage });
			await agent.poHomeOmnichannel.triggers.btnSave.click();
			await agent.poHomeOmnichannel.triggers.btnCloseToastMessage.click();
			await agent.page.waitForTimeout(500);
		});

		await test.step('expect to start conversation', async () => {
			await page.goto('/livechat');
			await poLiveChat.openLiveChat();
		});

		await test.step('expect not to have trigger message before registration', async () => {
			await expect(poLiveChat.txtChatMessage(triggerMessage)).not.toBeVisible();
			await expect(poLiveChat.btnChatNow).not.toBeVisible();
		});

		await test.step('expect to register visitor', async () => {
			await poLiveChat.sendMessage(newUser, false);
		});

		await test.step('expect trigger message after registration', async () => {
			await expect(poLiveChat.txtChatMessage(triggerMessage)).toBeVisible();
		});

		await test.step('expect send a message as a visitor', async () => {
			await poLiveChat.onlineAgentMessage.type('this_a_test_message_from_user');
			await poLiveChat.btnSendMessageToOnlineAgent.click();
			await expect(poLiveChat.txtChatMessage('this_a_test_message_from_user')).toBeVisible();
			await expect(poLiveChat.txtChatMessage(triggerMessage)).toBeVisible();
		});

		await test.step('expect to finish this chat', async () => {
			await poLiveChat.closeChat();
			await expect(poLiveChat.txtHeaderTitle).toBeVisible();
		});
	});

	test('OC - Livechat Triggers - Delete trigger', async () => {
		await agent.poHomeOmnichannel.triggers.btnDeletefirstRowInTable.click();
		await agent.poHomeOmnichannel.triggers.btnModalRemove.click();
		await expect(agent.poHomeOmnichannel.triggers.removeToastMessage).toBeVisible();
	});
});


test.describe('OC - Livechat New Chat Triggers', () => {
	let triggersName: string;
	let triggerMessage: string;
	let poLiveChat: OmnichannelLiveChat;
	let newUser: { email: string; name: string };
	let agent: { page: Page; poHomeOmnichannel: HomeOmnichannel };

	test.beforeAll(async ({ api, browser }) => {
		newUser = {
			name: faker.person.firstName(),
			email: faker.internet.email(),
		};
		triggersName = faker.string.uuid();
		triggerMessage = 'This is a trigger message after guest registration';
	
		const requests = await Promise.all([
			api.post('/livechat/users/agent', { username: 'user1' }),
			api.post('/livechat/users/manager', { username: 'user1' }),
		]);

		requests.every((e) => expect(e.status()).toBe(200));

		const { page } = await createAuxContext(browser, Users.user1, '/omnichannel/triggers');
		agent = { page, poHomeOmnichannel: new HomeOmnichannel(page) };
		await page.emulateMedia({ reducedMotion: 'reduce' });

		await agent.poHomeOmnichannel.triggers.createTrigger(triggersName, triggerMessage, 'after-guest-registration');
		await agent.poHomeOmnichannel.triggers.btnCloseToastMessage.click();
	});

	test.afterAll(async ({ api }) => {
		const ids = (await (await api.get('/livechat/triggers')).json()).triggers.map(
			(trigger: { _id: string }) => trigger._id,
		) as unknown as string[];

		await Promise.all(ids.map((id) => api.delete(`/livechat/triggers/${id}`)));

		await Promise.all([
			api.delete('/livechat/users/agent/user1'),
			api.delete('/livechat/users/manager/user1'),
			api.post('/settings/Livechat_clear_local_storage_when_chat_ended', { value: false }),
		]);
		await agent.page.close();
		await poLiveChat.page.close();
	});

	test.describe('OC - Livechat New Chat Triggers - After Registration', async () => {
		test.beforeAll(async ({api, browser}) => {
			const { page: livechatPage } = await createAuxContext(browser, Users.user1);

			poLiveChat = new OmnichannelLiveChat(livechatPage, api);

			await poLiveChat.page.goto('/livechat');
			await poLiveChat.sendMessageAndCloseChat(newUser);

			await poLiveChat.startNewChat();
		});

		await test('expect trigger message after registration', async () => {
			test.fail();
			await expect(poLiveChat.txtChatMessage(triggerMessage)).toBeVisible();
		});
	});

	test.describe('OC - Livechat New Chat Triggers - After Registration, clear Local storage', async () => {
		test.beforeAll(async ({api, browser}) => {
			await api.post('/settings/Livechat_clear_local_storage_when_chat_ended', { value: true });
			const { page: livechatPage } = await createAuxContext(browser, Users.user1);

			poLiveChat = new OmnichannelLiveChat(livechatPage, api);

			await poLiveChat.page.goto('/livechat');
			await poLiveChat.sendMessageAndCloseChat(newUser);

			await poLiveChat.startNewChat();
		});
	
		await test('expect trigger message after registration', async () => {
			test.fail();
			await poLiveChat.sendMessage(newUser, false);
			await expect(poLiveChat.txtChatMessage(triggerMessage)).toBeVisible();
		});
	});
});