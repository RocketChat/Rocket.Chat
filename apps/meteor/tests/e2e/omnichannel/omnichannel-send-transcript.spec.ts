import { faker } from '@faker-js/faker';
import type { Page } from '@playwright/test';

import { IS_EE } from '../config/constants';
import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { OmnichannelLiveChat, HomeChannel } from '../page-objects';
import { test, expect } from '../utils/test';

test.describe('omnichannel-transcript', () => {
	let poLiveChat: OmnichannelLiveChat;
	let newUser: { email: string; name: string };

	let agent: { page: Page; poHomeChannel: HomeChannel };
	test.beforeAll(async ({ api, browser }) => {
		newUser = {
			name: faker.person.firstName(),
			email: faker.internet.email(),
		};

		// Set user user 3 as manager and agent
		await api.post('/livechat/users/agent', { username: 'user3' });
		await api.post('/livechat/users/manager', { username: 'user3' });
		await api.post('/users.setStatus', { status: 'online', username: 'user3' }).then((res) => expect(res.status()).toBe(200));


		const { page } = await createAuxContext(browser, Users.user3);
		agent = { page, poHomeChannel: new HomeChannel(page) };
	});
	test.beforeEach(async ({ page, api }) => {
		poLiveChat = new OmnichannelLiveChat(page, api);
	});

	test.afterAll(async ({ api }) => {
		await api.delete('/livechat/users/agent/user3');
		await api.delete('/livechat/users/manager/user3');
		await agent.page.close();
	});

	test('Receiving a message from visitor', async ({ page }) => {
		await test.step('Expect send a message as a visitor', async () => {
			await page.goto('/livechat');
			await poLiveChat.openLiveChat();
			await poLiveChat.sendMessage(newUser, false);
			await poLiveChat.onlineAgentMessage.type('this_a_test_message_from_visitor');
			await poLiveChat.btnSendMessageToOnlineAgent.click();
		});

		await test.step('Expect to have 1 omnichannel assigned to agent 1', async () => {
			await agent.poHomeChannel.sidenav.openChat(newUser.name);
		});

		await test.step('Expect to be able to send transcript to email', async () => {
			await agent.poHomeChannel.content.btnSendTranscript.click();
			await agent.poHomeChannel.content.btnSendTranscriptToEmail.click();
			await agent.poHomeChannel.content.btnModalConfirm.click();
			await expect(agent.poHomeChannel.toastSuccess).toBeVisible();
		});

		await test.step('Expect to be not able send transcript as PDF', async () => {
			test.skip(!IS_EE, 'Enterprise Only');
			await agent.poHomeChannel.content.btnSendTranscript.click();
			await agent.poHomeChannel.content.btnSendTranscriptAsPDF.hover();
			await expect(agent.poHomeChannel.content.btnSendTranscriptAsPDF).toHaveAttribute('aria-disabled', 'true');
		});
	});
});
