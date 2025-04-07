import { createFakeVisitor } from '../../mocks/data';
import { IS_EE } from '../config/constants';
import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { HomeOmnichannel, OmnichannelLiveChat } from '../page-objects';
import { test, expect } from '../utils/test';

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
});
