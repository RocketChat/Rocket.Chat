import { faker } from '@faker-js/faker';

import { test, expect } from './utils/test';
import { OmnichannelLiveChat } from './page-objects';
import { createAuxContext } from './utils';

const newUser = {
	name: faker.name.firstName(),
	email: faker.internet.email(),
};

test.describe('omnichannel-departaments', () => {
	let poLiveChat: OmnichannelLiveChat;

	test.beforeEach(async ({ page }) => {
		await page.goto('/livechat');
		poLiveChat = new OmnichannelLiveChat(page);
	});

	test.beforeAll(async ({ api }) => {
		await api.post('/livechat/users/agent', { username: 'user1' });
	});

	test.describe('Receiving message from user', () => {
		test.beforeEach(async ({ browser, api }) => {
			const auxContext = await createAuxContext(browser, 'user1-session.json');
			await poLiveChat.btnOpenLiveChat('R').click();
			await poLiveChat.sendMessage(newUser, false);

			await poLiveChat.onlineAgentMessage.type('this_a_test_message_from_user');
			await poLiveChat.btnSendMessageToOnlineAgent.click();
			await auxContext.page.close();
			await api.post('/livechat/users/agent', { username: 'user2' });
		});

		test('transfer chat to another agent', async ({ browser }) => {
			const auxContext1 = await createAuxContext(browser, 'user1-session.json');
			const auxContext2 = await createAuxContext(browser, 'user2-session.json');

			await auxContext1.poHomeChannel.sidenav.openChat(newUser.name);
			await auxContext1.poHomeChannel.content.btnForwardChat.click();
			await auxContext1.poHomeChannel.content.forwardUser.type('user2');
			await auxContext1.poHomeChannel.content.btnConfirm.click();

			await auxContext2.poHomeChannel.sidenav.openChat(newUser.name);
			await expect(auxContext2.poHomeChannel.sidenav.someLocator).toBeVisible();
		});
	});
});
