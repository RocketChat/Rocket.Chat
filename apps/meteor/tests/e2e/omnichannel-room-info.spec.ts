import faker from '@faker-js/faker';
import type { Page } from '@playwright/test';

import { expect, test } from './utils/test';
import type { HomeChannel } from './page-objects';
import { OmnichannelLiveChat } from './page-objects';
import { createAuxContext } from './utils';
import { OmnichannelRoomInfo, OmnichannelEditRoomInfo } from './page-objects/fragments';

const visitor = {
	name: faker.name.firstName(),
	email: faker.internet.email(),
};

test.describe('Omnichannel room info', () => {
	let poLiveChat: OmnichannelLiveChat;
	let poOmnichannelRoomInfo: OmnichannelRoomInfo;
	let poOmnichannelEditRoomInfo: OmnichannelEditRoomInfo;
	let agent: { page: Page; poHomeChannel: HomeChannel };

	test.beforeAll(async ({ api, browser }) => {
		// Set user user 1 as manager and agent
		await api.post('/livechat/users/agent', { username: 'user1' });
		await api.post('/livechat/users/manager', { username: 'user1' });
		agent = await createAuxContext(browser, 'user1-session.json');
	});

	test.beforeEach(async ({ page }) => {
		poLiveChat = new OmnichannelLiveChat(page);
		poOmnichannelRoomInfo = new OmnichannelRoomInfo(page);
		poOmnichannelEditRoomInfo = new OmnichannelEditRoomInfo(page);
	});

	test.afterAll(async ({ api }) => {
		await api.delete('/livechat/users/agent/user1');
		await api.delete('/livechat/users/manager/user1');
	});

	test.describe.serial('Omnichannel room info', () => {
		test('Expect send a message as a visitor', async () => {
			await poLiveChat.btnOpenLiveChat('R').click();
			await poLiveChat.sendMessage(visitor, false);
			await poLiveChat.onlineAgentMessage.type('this_a_test_message_from_visitor');
			await poLiveChat.btnSendMessageToOnlineAgent.click();
		});

		test.describe('Omnichannel edit room info', () => {
			test.beforeAll(async () => {
				await agent.poHomeChannel.sidenav.openChat(visitor.name);
				await poOmnichannelRoomInfo.editButton.click();
			});

			test('Expect omnichannel edit room info is visible', async () => {
				await expect(poOmnichannelEditRoomInfo.topic.isVisible());
			});

			test('Expect save edited room info', async () => {
				await poOmnichannelEditRoomInfo.topic.fill('this_a_test_topic');
				await poOmnichannelEditRoomInfo.saveButton.click();

				await expect(poOmnichannelRoomInfo.labelTopic.isVisible());
			});
		});
	});
});
