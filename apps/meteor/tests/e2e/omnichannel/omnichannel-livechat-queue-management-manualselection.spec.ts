import { createFakeVisitor } from '../../mocks/data';
import { IS_EE } from '../config/constants';
import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { HomeOmnichannel, OmnichannelLiveChat } from '../page-objects';
import { test, expect } from '../utils/test';

const firstVisitor = createFakeVisitor();

const secondVisitor = createFakeVisitor();

test.use({ storageState: Users.user1.state });

test.describe('OC - Livechat - Queue Management', () => {
	test.skip(!IS_EE, 'Enterprise Only');

	let poHomeOmnichannel: HomeOmnichannel;
	let poLiveChat: OmnichannelLiveChat;

	const waitingQueueMessage = 'This is a message from Waiting Queue';
	const queuePosition1 = 'Your spot is #1';
	const queuePosition2 = 'Your spot is #2';

	test.beforeAll(async ({ api, browser }) => {
		await Promise.all([
			api.post('/settings/Livechat_Routing_Method', { value: 'Manual_Selection' }),
			api.post('/settings/Livechat_waiting_queue', { value: true }),
			api.post('/settings/Livechat_waiting_queue_message', { value: waitingQueueMessage }),
			api.post('/livechat/users/agent', { username: 'user1' }),
		]);

		const { page: omniPage } = await createAuxContext(browser, Users.user1, '/', true);
		poHomeOmnichannel = new HomeOmnichannel(omniPage);
	});

	test.beforeEach(async ({ browser, api }) => {
		const context = await browser.newContext();
		const page2 = await context.newPage();

		poLiveChat = new OmnichannelLiveChat(page2, api);
		await poLiveChat.page.goto('/livechat');
	});

	test.afterAll(async ({ api }) => {
		await Promise.all([
			api.post('/settings/Livechat_Routing_Method', { value: 'Auto_Selection' }),
			api.post('/settings/Livechat_waiting_queue', { value: false }),
			api.post('/settings/Livechat_waiting_queue_message', { value: '' }),
			api.delete('/livechat/users/agent/user1'),
		]);
		await poHomeOmnichannel.page.close();
	});

	test.afterEach(async () => {
		await poLiveChat.closeChat();
		await poLiveChat.page.close();
	});

	test('OC - Queue Management - Waiting Queue Message enabled', async () => {
		await test.step('should start livechat session', async () => {
			await poLiveChat.openAnyLiveChatAndSendMessage({
				liveChatUser: firstVisitor,
				message: 'Test message',
				isOffline: false,
			});
		});
		await test.step('expect to receive Waiting Queue message on chat', async () => {
			await expect(poLiveChat.page.locator(`div >> text=${waitingQueueMessage}`)).toBeVisible();
		});
	});

	test.describe('OC - Queue Management - Update Queue Position', () => {
		let poLiveChat2: OmnichannelLiveChat;

		test.beforeEach(async ({ browser, api }) => {
			const context = await browser.newContext();
			const page = await context.newPage();
			poLiveChat2 = new OmnichannelLiveChat(page, api);
			await poLiveChat2.page.goto('/livechat');
		});

		test.afterEach(async () => {
			await poLiveChat2.closeChat();
			await poLiveChat2.page.close();
		});

		test('Update user position on Queue', async () => {
			await test.step('should start secondary livechat session', async () => {
				await poLiveChat2.openAnyLiveChatAndSendMessage({
					liveChatUser: secondVisitor,
					message: 'Test message',
					isOffline: false,
				});
			});

			await test.step('should start primary livechat session', async () => {
				await poLiveChat.openAnyLiveChatAndSendMessage({
					liveChatUser: firstVisitor,
					message: 'Test message',
					isOffline: false,
				});
			});

			await test.step('should verify the queue position of the primary user', async () => {
				await expect(poLiveChat.page.locator(`div[role='alert'] >> text=${queuePosition2}`)).toBeVisible();
			});

			await test.step('should allow the agent to take the secondary user chat', async () => {
				await poHomeOmnichannel.sidenav.getQueuedChat(secondVisitor.name).click();
				await expect(poHomeOmnichannel.content.btnTakeChat).toBeVisible();
				await poHomeOmnichannel.content.btnTakeChat.click();
				await expect(poHomeOmnichannel.content.lastSystemMessageBody).toHaveText('joined the channel');
			});

			await test.step('expect the queue position of the primary user to update after the secondary users chat is taken', async () => {
				await expect(poLiveChat.page.locator(`div[role='alert'] >> text=${queuePosition1}`)).toBeVisible();
			});
		});
	});
});

test.describe('OC - Contact Manager Routing', () => {
	test.skip(!IS_EE, 'Enterprise Only');

	let poHomeOmnichannel: HomeOmnichannel;
	let poLiveChat: OmnichannelLiveChat;

	// User2 will be the contact manager
	let poHomeOmnichannelUser2: HomeOmnichannel;

	const visitorWithManager = createFakeVisitor();
	const contactId = `contact-${Date.now()}`;

	test.beforeAll(async ({ api, browser }) => {
		await api.post('/livechat/users/agent', { username: 'user2' });
		await api.post('/settings/Livechat_Routing_Method', { value: 'Manual_Selection' });
		await api.post('/omnichannel/contact', {
			_id: contactId,
			name: visitorWithManager.name,
			email: visitorWithManager.email,
			contactManager: {
				username: 'user2',
			},
		});

		const { page: omniPage } = await createAuxContext(browser, Users.user1, '/', true);
		poHomeOmnichannel = new HomeOmnichannel(omniPage);

		const { page: omniPageUser2 } = await createAuxContext(browser, Users.user2, '/', true);
		poHomeOmnichannelUser2 = new HomeOmnichannel(omniPageUser2);
	});

	test.beforeEach(async ({ browser, api }) => {
		const context = await browser.newContext();
		const page = await context.newPage();

		poLiveChat = new OmnichannelLiveChat(page, api);
		await poLiveChat.page.goto('/livechat');
	});

	test.afterAll(async ({ api }) => {
		await Promise.all([
			api.post('/settings/Livechat_Routing_Method', { value: 'Auto_Selection' }),
			api.delete('/livechat/users/agent/user1'),
			api.delete('/livechat/users/agent/user2'),
			api.delete(`/omnichannel/contact/${contactId}`),
		]);

		await poHomeOmnichannel.page.close();
		await poHomeOmnichannelUser2.page.close();
	});

	test.afterEach(async () => {
		await poLiveChat.closeChat();
		await poLiveChat.page.close();
	});

	test('should route inquiry only to the contact manager', async () => {
		await test.step('visitor with contact manager starts a chat', async () => {
			await poLiveChat.openAnyLiveChatAndSendMessage({
				liveChatUser: visitorWithManager,
				message: 'I need assistance',
				isOffline: false,
			});
		});

		await test.step('verify non-manager agent does not see the inquiry', async () => {
			const nonManagerQueuedChat = poHomeOmnichannel.sidenav.getQueuedChat(visitorWithManager.name);
			await expect(nonManagerQueuedChat).toHaveCount(0);
		});

		await test.step('verify the contact manager agent sees the inquiry', async () => {
			const managerQueuedChat = poHomeOmnichannelUser2.sidenav.getQueuedChat(visitorWithManager.name);
			await expect(managerQueuedChat).toBeVisible();
		});

		await test.step('contact manager can take the chat', async () => {
			await poHomeOmnichannelUser2.sidenav.getQueuedChat(visitorWithManager.name).click();
			await expect(poHomeOmnichannelUser2.content.btnTakeChat).toBeVisible();
			await poHomeOmnichannelUser2.content.btnTakeChat.click();
			await expect(poHomeOmnichannelUser2.content.lastSystemMessageBody).toHaveText('joined the channel');
		});
	});

	test('inquiry should persist only in contact manager queue after page refresh', async () => {
		const anotherVisitorWithManager = createFakeVisitor();

		await test.step('visitor with contact manager starts a chat', async () => {
			await poLiveChat.openAnyLiveChatAndSendMessage({
				liveChatUser: anotherVisitorWithManager,
				message: 'I need help after refresh test',
				isOffline: false,
			});
		});

		await test.step('refresh both agent pages', async () => {
			await poHomeOmnichannel.page.reload();
			await poHomeOmnichannel.page.waitForLoadState('networkidle');

			await poHomeOmnichannelUser2.page.reload();
			await poHomeOmnichannelUser2.page.waitForLoadState('networkidle');
		});

		await test.step('verify non-manager agent still does not see the inquiry after refresh', async () => {
			const nonManagerQueuedChat = poHomeOmnichannel.sidenav.getQueuedChat(anotherVisitorWithManager.name);
			await expect(nonManagerQueuedChat).toHaveCount(0);
		});

		await test.step('verify the contact manager still sees the inquiry after refresh', async () => {
			const managerQueuedChat = poHomeOmnichannelUser2.sidenav.getQueuedChat(anotherVisitorWithManager.name);
			await expect(managerQueuedChat).toBeVisible();
		});

		await test.step('contact manager can take the chat after refresh', async () => {
			await poHomeOmnichannelUser2.sidenav.getQueuedChat(anotherVisitorWithManager.name).click();
			await expect(poHomeOmnichannelUser2.content.btnTakeChat).toBeVisible();
			await poHomeOmnichannelUser2.content.btnTakeChat.click();
			await expect(poHomeOmnichannelUser2.content.lastSystemMessageBody).toHaveText('joined the channel');
		});
	});
});

test.describe('OC - Bot Agent Routing Enabled', () => {
	test.skip(!IS_EE, 'Enterprise Only');

	// User1 will be the bot agent
	let poHomeOmnichannel: HomeOmnichannel;

	// User2 will be the human agent
	let poHomeOmnichannelUser2: HomeOmnichannel;

	let poLiveChat: OmnichannelLiveChat;

	const visitorBot = createFakeVisitor();
	const visitorHuman = createFakeVisitor();

	test.beforeEach(async ({ browser, api }) => {
		const context = await browser.newContext();
		const page = await context.newPage();

		poLiveChat = new OmnichannelLiveChat(page, api);
		await poLiveChat.page.goto('/livechat');
	});

	test.beforeAll(async ({ api, browser }) => {
		await api.post('/users.update', {
			userId: 'user1',
			data: {
				roles: ['user', 'bot'],
			},
		});
		await api.post('/livechat/users/agent', { username: 'user1' });
		await api.post('/livechat/users/agent', { username: 'user2' });

		await api.post('/settings/Livechat_Routing_Method', { value: 'Manual_Selection' });
		await api.post('/settings/Livechat_assign_new_conversation_to_bot', { value: true });

		const { page: omniPage } = await createAuxContext(browser, Users.user1, '/', true);
		poHomeOmnichannel = new HomeOmnichannel(omniPage);

		const { page: omniPageUser2 } = await createAuxContext(browser, Users.user2, '/', true);
		poHomeOmnichannelUser2 = new HomeOmnichannel(omniPageUser2);
	});

	test.afterAll(async ({ api }) => {
		await Promise.all([
			api.post('/settings/Livechat_Routing_Method', { value: 'Auto_Selection' }),
			api.post('/settings/Livechat_assign_new_conversation_to_bot', { value: false }),
			api.delete('/livechat/users/agent/user1'),
			api.delete('/livechat/users/agent/user2'),
			api.post('/users.update', {
				userId: 'user1',
				data: {
					roles: ['user'],
				},
			}),
		]);

		await poHomeOmnichannel.page.close();
		await poHomeOmnichannelUser2.page.close();
	});

	test.afterEach(async () => {
		await poLiveChat.closeChat();
		await poLiveChat.page.close();
	});

	test('should prioritize bot agent over human agents when setting is enabled', async () => {
		await test.step('visitor starts a chat', async () => {
			await poLiveChat.openAnyLiveChatAndSendMessage({
				liveChatUser: visitorBot,
				message: 'Hello, I should be assigned to a bot agent',
				isOffline: false,
			});
		});

		await test.step('verify chat is assigned to bot', async () => {
			const botQueuedChat = poHomeOmnichannel.sidenav.getQueuedChat(visitorBot.name);
			await expect(botQueuedChat).toBeVisible();
		});
		await test.step('verify non-bot agent does not see the inquiry', async () => {
			const nonBotQueuedChat = poHomeOmnichannelUser2.sidenav.getQueuedChat(visitorBot.name);
			await expect(nonBotQueuedChat).toHaveCount(0);
		});

		await test.step('bot agent can see the chat', async () => {
			await poHomeOmnichannel.sidenav.getQueuedChat(visitorBot.name).click();
			await expect(poHomeOmnichannel.content.lastSystemMessageBody).toHaveText('joined the channel');
		});
	});

	test.describe('OC - Bot Agent Routing Disabled', () => {
		test('should not route directly to bot when setting is disabled', async ({ api }) => {
			await test.step('disable bot routing setting', async () => {
				await api.post('/settings/Livechat_assign_new_conversation_to_bot', { value: false });
			});

			await test.step('visitor starts a chat', async () => {
				await poLiveChat.openAnyLiveChatAndSendMessage({
					liveChatUser: visitorBot,
					message: 'Hello, I should be in the queue',
					isOffline: false,
				});
			});

			await test.step('verify chat is in queue and not directly assigned to bot', async () => {
				const botQueuedChat = poHomeOmnichannel.sidenav.getQueuedChat(visitorBot.name);
				await expect(botQueuedChat).toBeVisible();
			});

			await test.step('verify human agent also sees the chat in queue', async () => {
				const humanQueuedChat = poHomeOmnichannelUser2.sidenav.getQueuedChat(visitorBot.name);
				await expect(humanQueuedChat).toBeVisible();
			});

			await test.step('human agent can take the chat', async () => {
				await poHomeOmnichannelUser2.sidenav.getQueuedChat(visitorBot.name).click();
				await expect(poHomeOmnichannelUser2.content.btnTakeChat).toBeVisible();
				await poHomeOmnichannelUser2.content.btnTakeChat.click();
				await expect(poHomeOmnichannelUser2.content.lastSystemMessageBody).toHaveText('joined the channel');
			});
		});
	});

	// Chat is not being assigned to any agent when "Assign New Conversations to Bot Agent" is enabled and bot is not available
	test.fixme('should route to bot agent even when bot is offline', async () => {
		await test.step('make the bot offline', async () => {
			await poHomeOmnichannel.sidenav.switchOmnichannelStatus('offline');
		});

		await test.step('visitor starts a chat', async () => {
			await poLiveChat.openAnyLiveChatAndSendMessage({
				liveChatUser: visitorHuman,
				message: 'Hello, I should be assigned to the bot agent even though it is offline',
				isOffline: false,
			});
		});

		await test.step('verify chat is assigned to bot agent even when offline', async () => {
			const botQueuedChat = poHomeOmnichannel.sidenav.getQueuedChat(visitorHuman.name);
			await expect(botQueuedChat).toBeVisible();
		});

		await test.step('verify non-bot agent does not see the inquiry', async () => {
			const nonBotQueuedChat = poHomeOmnichannelUser2.sidenav.getQueuedChat(visitorHuman.name);
			await expect(nonBotQueuedChat).toHaveCount(0);
		});

		await test.step('bot agent should take the chat even when offline', async () => {
			await poHomeOmnichannel.sidenav.getQueuedChat(visitorHuman.name).click();
			await expect(poHomeOmnichannel.content.lastSystemMessageBody).toHaveText('joined the channel');
		});
		await test.step('make the bot online', async () => {
			await poHomeOmnichannel.sidenav.switchOmnichannelStatus('online');
		});
	});
});
