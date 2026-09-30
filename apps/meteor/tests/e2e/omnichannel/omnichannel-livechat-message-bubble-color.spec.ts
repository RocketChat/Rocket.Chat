import type { IOmnichannelRoom } from '@rocket.chat/core-typings';

import { createFakeVisitor } from '../../mocks/data';
import { Users } from '../fixtures/userStates';
import { OmnichannelLiveChatEmbedded } from '../page-objects/omnichannel';
import { createAgent, makeAgentAvailable } from '../utils/omnichannel/agents';
import { closeRoom } from '../utils/omnichannel/rooms';
import { sendMessageFromUser } from '../utils/sendMessage';
import type { BaseTest } from '../utils/test';
import { test, expect } from '../utils/test';

declare const window: Window & {
	RocketChat: {
		livechat: {
			setTheme: (theme: { guestBubbleBackgroundColor?: string; agentBubbleBackgroundColor?: string }) => void;
		};
	};
};

const getOpenRoomByVisitorName = async (api: BaseTest['api'], name: string): Promise<IOmnichannelRoom> => {
	const { rooms } = await (await api.get('/livechat/rooms', { roomName: name, open: true })).json();
	return rooms[0];
};

test.use({ storageState: Users.user1.state });

test.describe('OC - Livechat - Bubble background color', async () => {
	let agent: Awaited<ReturnType<typeof createAgent>>;
	let poLiveChat: OmnichannelLiveChatEmbedded;

	test.beforeAll(async ({ api }) => {
		agent = await createAgent(api, 'user1');

		const res = await makeAgentAvailable(api, agent.data._id);

		if (res.status() !== 200) {
			throw new Error('Failed to make agent available');
		}
	});

	test.beforeEach(async ({ page }) => {
		poLiveChat = new OmnichannelLiveChatEmbedded(page);

		await poLiveChat.goto();
	});

	test.afterEach(async ({ page }) => {
		await page.close();
	});

	test.afterAll(async () => {
		await agent.delete();
	});

	test('OC - Livechat - Change bubble background color', async ({ api, request }) => {
		const visitor = createFakeVisitor();

		await test.step('should initiate Livechat conversation', async () => {
			await poLiveChat.openLiveChat();
			await poLiveChat.sendMessage(visitor, false);
			await poLiveChat.onlineAgentMessage.fill('message_from_user');
			await poLiveChat.btnSendMessageToOnlineAgent.click();
			await expect(poLiveChat.txtChatMessage('message_from_user')).toBeVisible();
		});

		await test.step('expect to send a message as agent', async () => {
			const room = await getOpenRoomByVisitorName(api, visitor.name);
			await sendMessageFromUser(request, Users.user1, room._id, 'message_from_agent');
			await expect(poLiveChat.txtChatMessage('message_from_agent')).toBeVisible();
		});

		await test.step('expect to have default bubble background color', async () => {
			expect(await poLiveChat.messageBubbleBackground('message_from_user')).toBe('rgb(193, 39, 45)');
			expect(await poLiveChat.messageBubbleBackground('message_from_agent')).toBe('rgb(247, 248, 250)');
		});

		await test.step('expect to change bubble background color', async () => {
			await poLiveChat.page.evaluate(() =>
				window.RocketChat.livechat.setTheme({
					guestBubbleBackgroundColor: 'rgb(186, 218, 85)',
					agentBubbleBackgroundColor: 'rgb(0, 100, 250)',
				}),
			);

			expect(await poLiveChat.messageBubbleBackground('message_from_user')).toBe('rgb(186, 218, 85)');
			expect(await poLiveChat.messageBubbleBackground('message_from_agent')).toBe('rgb(0, 100, 250)');
		});

		await test.step('expect to reset bubble background color to defaults', async () => {
			await poLiveChat.page.evaluate(() =>
				window.RocketChat.livechat.setTheme({ guestBubbleBackgroundColor: undefined, agentBubbleBackgroundColor: undefined }),
			);

			expect(await poLiveChat.messageBubbleBackground('message_from_user')).toBe('rgb(193, 39, 45)');
			expect(await poLiveChat.messageBubbleBackground('message_from_agent')).toBe('rgb(247, 248, 250)');
		});

		await test.step('should close the conversation', async () => {
			const room = await getOpenRoomByVisitorName(api, visitor.name);
			await closeRoom(api, { roomId: room._id, visitorToken: room.v.token });
		});
	});
});
