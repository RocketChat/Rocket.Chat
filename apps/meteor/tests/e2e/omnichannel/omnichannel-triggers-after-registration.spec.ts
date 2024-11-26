import { faker } from '@faker-js/faker';
import type { Page } from '@playwright/test';

import { createFakeVisitor } from '../../mocks/data';
import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { OmnichannelLiveChat, HomeOmnichannel } from '../page-objects';
import { setSettingValueById } from '../utils';
import { createAgent } from '../utils/omnichannel/agents';
import { createManager } from '../utils/omnichannel/managers';
import { deleteClosedRooms } from '../utils/omnichannel/rooms';
import { test, expect } from '../utils/test';

test.describe('OC - Livechat New Chat Triggers - After Registration', () => {
	let triggersName: string;
	let triggerMessage: string;
	let poLiveChat: OmnichannelLiveChat;
	let newVisitor: { email: string; name: string };
	let agent: { page: Page; poHomeOmnichannel: HomeOmnichannel };

	test.beforeEach(async ({ api, browser, page }) => {
		newVisitor = createFakeVisitor();
		triggersName = faker.string.uuid();
		triggerMessage = 'This is a trigger message after guest registration';

		await api.post('/livechat/triggers', {
			name: triggersName,
			description: 'Creating a fresh trigger',
			enabled: true,
			runOnce: false,
			conditions: [
				{
					name: 'after-guest-registration',
					value: '',
				},
			],
			actions: [
				{
					name: 'send-message',
					params: {
						name: '',
						msg: triggerMessage,
						sender: 'queue',
					},
				},
			],
		});

		await Promise.all([createAgent(api, 'user1'), createManager(api, 'user1')]);

		const { page: agentPage } = await createAuxContext(browser, Users.user1);
		agent = { page: agentPage, poHomeOmnichannel: new HomeOmnichannel(agentPage) };

		poLiveChat = new OmnichannelLiveChat(page, api);
	});

	test.afterEach(async ({ api }) => {
		const ids = (await (await api.get('/livechat/triggers')).json()).triggers.map(
			(trigger: { _id: string }) => trigger._id,
		) as unknown as string[];

		await Promise.all(ids.map((id) => api.delete(`/livechat/triggers/${id}`)));

		await Promise.all([api.delete('/livechat/users/agent/user1'), api.delete('/livechat/users/manager/user1')]);

		await agent.page.close();
	});

	test.afterAll(async ({ api }) => {
		await deleteClosedRooms(api);
		await setSettingValueById(api, 'Livechat_clear_local_storage_when_chat_ended', false);
	});

	test('OC - Livechat New Chat Triggers - After Registration', async () => {
		await test.step('expect trigger message after registration', async () => {
			await poLiveChat.page.goto('/livechat');
			await poLiveChat.startAndCloseChat(newVisitor);

			await poLiveChat.btnNewChat.click();
			await expect(poLiveChat.txtChatMessage(triggerMessage)).toBeVisible();
		});
	});

	test('OC - Livechat Triggers - After Registration - Reload', async () => {
		await test.step('expect trigger message after registration', async () => {
			await test.step('expect trigger message after registration to be visible', async () => {
				await poLiveChat.page.goto('/livechat');
				await poLiveChat.btnOpenLiveChat.click();
				await poLiveChat.registerVisitor(newVisitor);
				await expect(poLiveChat.txtChatMessage(triggerMessage)).toBeVisible();
			});

			await test.step('expect trigger message after registration to be visible after reload', async () => {
				await poLiveChat.page.reload();
				await poLiveChat.btnOpenLiveChat.click();
				await expect(poLiveChat.txtChatMessage(triggerMessage)).toBeVisible();
			});

			await test.step('expect to close room and reload', async () => {
				await poLiveChat.sendMessage('message_after_trigger');
				await expect(poLiveChat.txtChatMessage('message_after_trigger')).toBeVisible();
				await poLiveChat.closeChat();

				await expect(poLiveChat.btnNewChat).toBeVisible();
				await poLiveChat.btnNewChat.click();
				await poLiveChat.page.reload();
			});

			await test.step('expect trigger message after registration to be visible after reload on new chat', async () => {
				await poLiveChat.btnOpenLiveChat.click();
				await expect(poLiveChat.txtChatMessage(triggerMessage)).toBeVisible();
			});
		});
	});

	test.describe('OC - Livechat New Chat Triggers - After Registration, clear Local storage', async () => {
		test.beforeAll(async ({ api }) => {
			await setSettingValueById(api, 'Livechat_clear_local_storage_when_chat_ended', true);
		});

		test('expect trigger message after registration not be visible after local storage clear', async () => {
			await poLiveChat.page.goto('/livechat');
			await poLiveChat.startAndCloseChat();

			await expect(poLiveChat.btnNewChat).toBeVisible();
			await expect(poLiveChat.txtChatMessage(triggerMessage)).not.toBeVisible();

			await poLiveChat.btnNewChat.click();
			await poLiveChat.registerVisitor(newVisitor);
			await expect(poLiveChat.txtChatMessage(triggerMessage)).toBeVisible();
		});
	});
});
