import { createFakeVisitor } from '../../mocks/data';
import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { HomeOmnichannel, OmnichannelLiveChat } from '../page-objects';
import { setSettingValueById } from '../utils';
import { createAgent } from '../utils/omnichannel/agents';
import { test, expect } from '../utils/test';

const firstVisitor = createFakeVisitor();

const secondVisitor = createFakeVisitor();

test.use({ storageState: Users.user1.state });

test.describe.serial('OC - Livechat', () => {
	let poLiveChat: OmnichannelLiveChat;
	let poHomeOmnichannel: HomeOmnichannel;

	test.beforeAll(async ({ api }) => {
		const statusCode = (await api.post('/livechat/users/agent', { username: 'user1' })).status();
		expect(statusCode).toBe(200);
	});

	test.beforeAll(async ({ browser, api }) => {
		const { page: livechatPage } = await createAuxContext(browser, Users.user1, '/livechat', false);

		poLiveChat = new OmnichannelLiveChat(livechatPage, api);
	});

	test.beforeEach(async ({ page }) => {
		poHomeOmnichannel = new HomeOmnichannel(page);

		await page.goto('/');
		await page.locator('.main-content').waitFor();
	});

	test.afterAll(async ({ api }) => {
		await api.delete('/livechat/users/agent/user1');
		await poLiveChat.page.close();
	});

	test('OC - Livechat - Send message to online agent', async () => {
		await test.step('expect message to be sent by livechat', async () => {
			await poLiveChat.page.reload();
			await poLiveChat.openAnyLiveChat();
			await poLiveChat.sendMessage(firstVisitor, false);

			await poLiveChat.onlineAgentMessage.fill('this_a_test_message_from_user');
			await poLiveChat.btnSendMessageToOnlineAgent.click();

			await expect(poLiveChat.page.locator('div >> text="this_a_test_message_from_user"')).toBeVisible();
		});

		await test.step('expect message to be received by agent', async () => {
			await poHomeOmnichannel.sidenav.openChat(firstVisitor.name);
			await expect(poHomeOmnichannel.content.lastUserMessage).toBeVisible();
			await expect(poHomeOmnichannel.content.lastUserMessage).toContainText('this_a_test_message_from_user');
		});
	});

	test('OC - Livechat - Send message to livechat customer', async () => {
		await poHomeOmnichannel.sidenav.openChat(firstVisitor.name);

		await test.step('expect message to be sent by agent', async () => {
			await poHomeOmnichannel.content.sendMessage('this_a_test_message_from_agent');
			await expect(poLiveChat.page.locator('div >> text="this_a_test_message_from_agent"')).toBeVisible();
		});

		await test.step('expect when user minimizes the livechat screen, the composer should be hidden', async () => {
			await poLiveChat.openAnyLiveChat();
			await expect(poLiveChat.page.locator('[contenteditable="true"]')).not.toBeVisible();
		});

		await test.step('expect message to be received by minimized livechat', async () => {
			await poHomeOmnichannel.content.sendMessage('this_a_test_message_again_from_agent');
			await expect(poLiveChat.unreadMessagesBadge(1)).toBeVisible();
		});

		await test.step('expect multiple messages to be received by minimized livechat', async () => {
			await poHomeOmnichannel.content.sendMessage('this_a_test_message_once_again_from_agent');
			await expect(poLiveChat.unreadMessagesBadge(2)).toBeVisible();
		});

		await test.step('expect unread messages to be visible after a reload', async () => {
			await poLiveChat.page.reload();
			await expect(poLiveChat.unreadMessagesBadge(2)).toBeVisible();
		});
	});

	test('OC - Livechat - Send message to agent after reload', async () => {
		await test.step('expect unread counter to be empty after user sends a message', async () => {
			await poLiveChat.openAnyLiveChat();
			await poLiveChat.onlineAgentMessage.fill('this_a_test_message_from_user');
			await poLiveChat.btnSendMessageToOnlineAgent.click();
			expect(await poLiveChat.unreadMessagesBadge(0).all()).toHaveLength(0);
		});
	});

	test('OC - Livechat - Close livechat conversation', async () => {
		await poHomeOmnichannel.sidenav.openChat(firstVisitor.name);

		await test.step('expect livechat conversation to be closed by agent', async () => {
			await poHomeOmnichannel.content.btnCloseChat.click();
			await poHomeOmnichannel.content.closeChatModal.inputComment.fill('this_is_a_test_comment');
			await poHomeOmnichannel.content.closeChatModal.btnConfirm.click();
			await expect(poHomeOmnichannel.toastSuccess).toBeVisible();
		});
	});
});

test.describe.serial('OC - Livechat - Visitors closing the room is disabled', () => {
	let poLiveChat: OmnichannelLiveChat;
	let poHomeOmnichannel: HomeOmnichannel;

	test.beforeAll(async ({ api }) => {
		await api.post('/livechat/users/agent', { username: 'user1' });
	});

	test.beforeAll(async ({ browser, api }) => {
		const { page: livechatPage } = await createAuxContext(browser, Users.user1, '/livechat', false);

		poLiveChat = new OmnichannelLiveChat(livechatPage, api);
	});

	test.beforeAll(async ({ browser, api }) => {
		await setSettingValueById(api, 'Livechat_allow_visitor_closing_chat', false);
		const { page: omniPage } = await createAuxContext(browser, Users.user1, '/', true);
		poHomeOmnichannel = new HomeOmnichannel(omniPage);
	});

	test.afterAll(async ({ api }) => {
		await setSettingValueById(api, 'Livechat_allow_visitor_closing_chat', true);
		await api.delete('/livechat/users/agent/user1');
		await poLiveChat.page.close();
	});

	test('OC - Livechat - Close Chat disabled', async () => {
		await poLiveChat.page.reload();
		await poLiveChat.openAnyLiveChat();
		await poLiveChat.sendMessage(firstVisitor, false);
		await poLiveChat.onlineAgentMessage.fill('this_a_test_message_from_user');
		await poLiveChat.btnSendMessageToOnlineAgent.click();

		await test.step('expect to close a livechat conversation', async () => {
			await expect(poLiveChat.btnOptions).not.toBeVisible();
			await expect(poLiveChat.btnCloseChat).not.toBeVisible();
		});
	});

	test('OC - Livechat - Close chat disabled, agents can close', async () => {
		await poHomeOmnichannel.sidenav.openChat(firstVisitor.name);

		await test.step('expect livechat conversation to be closed by agent', async () => {
			await poHomeOmnichannel.content.btnCloseChat.click();
			await poHomeOmnichannel.content.closeChatModal.inputComment.fill('this_is_a_test_comment');
			await poHomeOmnichannel.content.closeChatModal.btnConfirm.click();
			await expect(poHomeOmnichannel.toastSuccess).toBeVisible();
		});
	});
});

test.describe.serial('OC - Livechat - Resub after close room', () => {
	let poLiveChat: OmnichannelLiveChat;
	let poHomeOmnichannel: HomeOmnichannel;

	test.beforeAll(async ({ api }) => {
		const statusCode = (await api.post('/livechat/users/agent', { username: 'user1' })).status();
		expect(statusCode).toBe(200);
	});

	test.beforeAll(async ({ browser, api }) => {
		await api.post('/settings/Livechat_clear_local_storage_when_chat_ended', { value: true });
		const { page: omniPage } = await createAuxContext(browser, Users.user1, '/', true);
		poHomeOmnichannel = new HomeOmnichannel(omniPage);

		const { page: livechatPage } = await createAuxContext(browser, Users.user1, '/livechat', false);
		poLiveChat = new OmnichannelLiveChat(livechatPage, api);

		await poLiveChat.sendMessageAndCloseChat(firstVisitor);
	});

	test.afterAll(async ({ api }) => {
		await api.post('/settings/Livechat_clear_local_storage_when_chat_ended', { value: false });
		await api.delete('/livechat/users/agent/user1');
		await poLiveChat.page.close();
		await poHomeOmnichannel.page.close();
	});

	test('OC - Livechat - Resub after close room', async () => {
		await test.step('expect livechat conversation to be opened again, different guest', async () => {
			await poLiveChat.startNewChat();
			await poLiveChat.sendMessage(secondVisitor, false);
			await poLiveChat.onlineAgentMessage.fill('this_a_test_message_from_user');
			await poLiveChat.btnSendMessageToOnlineAgent.click();
			await expect(poLiveChat.page.locator('div >> text="this_a_test_message_from_user"')).toBeVisible();
		});

		await test.step('expect message to be received by agent', async () => {
			await poHomeOmnichannel.sidenav.openChat(secondVisitor.name);
			await expect(poHomeOmnichannel.content.lastUserMessage).toBeVisible();
			await expect(poHomeOmnichannel.content.lastUserMessage).toContainText('this_a_test_message_from_user');
		});

		await test.step('expect message to be sent by agent', async () => {
			await poHomeOmnichannel.content.sendMessage('this_a_test_message_from_agent');
			await expect(poLiveChat.page.locator('div >> text="this_a_test_message_from_agent"')).toBeVisible();
		});
	});
});

test.describe('OC - Livechat - Resume chat after closing', () => {
	let poLiveChat: OmnichannelLiveChat;
	let poHomeOmnichannel: HomeOmnichannel;

	test.beforeAll(async ({ api }) => {
		const statusCode = (await api.post('/livechat/users/agent', { username: 'user1' })).status();
		expect(statusCode).toBe(200);
	});

	test.beforeAll(async ({ browser, api }) => {
		const { page: omniPage } = await createAuxContext(browser, Users.user1, '/', true);
		poHomeOmnichannel = new HomeOmnichannel(omniPage);

		const { page: livechatPage } = await createAuxContext(browser, Users.user1, '/livechat', false);
		poLiveChat = new OmnichannelLiveChat(livechatPage, api);

		await poLiveChat.sendMessageAndCloseChat(firstVisitor);
	});

	test.afterAll(async ({ api }) => {
		await api.delete('/livechat/users/agent/user1');
		await poLiveChat.page.close();
		await poHomeOmnichannel.page.close();
	});

	test('OC - Livechat - Resume chat after closing', async () => {
		await test.step('expect livechat conversation to be opened again', async () => {
			await poLiveChat.startNewChat();
			await expect(poLiveChat.onlineAgentMessage).toBeVisible();
			await poLiveChat.onlineAgentMessage.fill('this_a_test_message_from_user');
			await poLiveChat.btnSendMessageToOnlineAgent.click();
			await expect(poLiveChat.page.locator('div >> text="this_a_test_message_from_user"')).toBeVisible();
		});

		await test.step('expect message to be received by agent', async () => {
			await poHomeOmnichannel.sidenav.openChat(firstVisitor.name);
			await expect(poHomeOmnichannel.content.lastUserMessage).toBeVisible();
			await expect(poHomeOmnichannel.content.lastUserMessage).toContainText('this_a_test_message_from_user');
		});

		await test.step('expect message to be sent by agent', async () => {
			await poHomeOmnichannel.content.sendMessage('this_a_test_message_from_agent');
			await expect(poLiveChat.page.locator('div >> text="this_a_test_message_from_agent"')).toBeVisible();
		});
	});
});

test.describe('OC - Livechat - Close chat using widget', () => {
	let poLiveChat: OmnichannelLiveChat;
	let poHomeOmnichannel: HomeOmnichannel;
	let agent: Awaited<ReturnType<typeof createAgent>>;

	test.beforeAll(async ({ browser, api }) => {
		agent = await createAgent(api, 'user1');

		const { page } = await createAuxContext(browser, Users.user1, '/');
		poHomeOmnichannel = new HomeOmnichannel(page);
	});

	test.beforeEach(async ({ page, api }) => {
		poLiveChat = new OmnichannelLiveChat(page, api);

		await poLiveChat.page.goto('/livechat');
	});

	test.afterAll(async () => {
		await poHomeOmnichannel.page.close();
		await agent.delete();
	});

	test('OC - Livechat - Close Chat', async () => {
		await poLiveChat.openAnyLiveChat();
		await poLiveChat.sendMessage(firstVisitor, false);
		await poLiveChat.onlineAgentMessage.fill('this_a_test_message_from_user');
		await poLiveChat.btnSendMessageToOnlineAgent.click();

		await test.step('expect to close a livechat conversation', async () => {
			await expect(poLiveChat.btnOptions).toBeVisible();
			await poLiveChat.btnOptions.click();

			await expect(poLiveChat.btnCloseChat).toBeVisible();
			await poLiveChat.btnCloseChat.click();

			await poLiveChat.btnCloseChatConfirm.click();

			await expect(poLiveChat.btnNewChat).toBeVisible();
		});
	});

	test('OC - Livechat - Close Chat twice', async () => {
		await poLiveChat.sendMessageAndCloseChat(firstVisitor);
		await poLiveChat.startNewChat();
		await poLiveChat.onlineAgentMessage.fill('this_a_test_message_from_user');
		await poLiveChat.btnSendMessageToOnlineAgent.click();

		await test.step('expect to close a livechat conversation a second time', async () => {
			await expect(poLiveChat.btnOptions).toBeVisible();
			await poLiveChat.btnOptions.click();

			await expect(poLiveChat.btnCloseChat).toBeVisible();
			await poLiveChat.btnCloseChat.click();

			await poLiveChat.btnCloseChatConfirm.click();

			await expect(poLiveChat.btnNewChat).toBeVisible();
		});
	});
});

test.describe('OC - Livechat - Livechat_Display_Offline_Form', () => {
	let poLiveChat: OmnichannelLiveChat;
	const message = 'This form is not available';

	test.beforeAll(async ({ api }) => {
		await api.post('/settings/Livechat_display_offline_form', { value: false });
		await api.post('/settings/Livechat_offline_form_unavailable', { value: message });
	});

	test.beforeEach(async ({ page, api }) => {
		poLiveChat = new OmnichannelLiveChat(page, api);
		await poLiveChat.page.goto('/livechat');
	});

	test.afterAll(async ({ api }) => {
		await api.post('/settings/Livechat_display_offline_form', { value: true });
		await api.post('/settings/Livechat_offline_form_unavailable', { value: '' });
	});

	test('OC - Livechat - Livechat_Display_Offline_Form false', async () => {
		await test.step('expect offline form to not be visible', async () => {
			await poLiveChat.openAnyLiveChat();
			await expect(poLiveChat.page.locator(`div >> text=${message}`)).toBeVisible();
			await expect(poLiveChat.textAreaMessage).not.toBeVisible();
		});
	});
});
