import { faker } from '@faker-js/faker';
import type { Page } from '@playwright/test';

import { IS_EE } from '../config/constants';
import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { OmnichannelLiveChat, HomeOmnichannel } from '../page-objects';
import { test, expect } from '../utils/test';

test.skip(!IS_EE, 'Export transcript as PDF > Enterprie Only');

test.describe('omnichannel- export chat transcript as PDF', () => {
	let poLiveChat: OmnichannelLiveChat;
	let newUser: { email: string; name: string };

	let agent: { page: Page; poHomeChannel: HomeOmnichannel };
	test.beforeAll(async ({ api, browser }) => {
		newUser = {
			name: faker.person.firstName(),
			email: faker.internet.email(),
		};

		// Set user user 1 as manager and agent
		await api.post('/livechat/users/agent', { username: 'user1' });
		await api.post('/livechat/users/manager', { username: 'user1' });

		const { page } = await createAuxContext(browser, Users.user1);
		agent = { page, poHomeChannel: new HomeOmnichannel(page) };
	});
	test.beforeEach(async ({ page }) => {
		poLiveChat = new OmnichannelLiveChat(page);
	});

	test.afterAll(async ({ api }) => {
		await api.delete('/livechat/users/agent/user1');
		await api.delete('/livechat/users/manager/user1');
		await agent.page.close();
	});

	test('Export PDF transcript', async ({ page }) => {
		await test.step('Expect send a message as a visitor', async () => {
			await page.goto('/livechat');
			await poLiveChat.openLiveChat();
			await poLiveChat.sendMessage(newUser, false);
			await poLiveChat.onlineAgentMessage.type('this_a_test_message_from_visitor');
			await poLiveChat.btnSendMessageToOnlineAgent.click();
		});

		await test.step('Expect to have 1 omnichannel assigned to agent 1', async () => {
			await new Promise((resolve) => setTimeout(resolve, 5000));
			await agent.poHomeChannel.sidenav.openChat(newUser.name);
		});

		await test.step('Expect to be not able send transcript as PDF', async () => {
			await agent.poHomeChannel.content.btnSendTranscript.click();
			await agent.poHomeChannel.content.btnSendTranscriptAsPDF.hover();
			await expect(agent.poHomeChannel.content.btnSendTranscriptAsPDF).toHaveAttribute('aria-disabled', 'true');
		});

		await test.step('Expect chat to be closed', async () => {
			await agent.poHomeChannel.content.btnCloseChat.click();
			await agent.poHomeChannel.content.inputModalClosingComment.type('any_comment');
			await agent.poHomeChannel.transcript.checkboxPDF.click();
			await agent.poHomeChannel.content.btnModalConfirm.click();
			await expect(agent.poHomeChannel.toastSuccess).toBeVisible();
		});

		// Exported PDF can be downloaded from rocket.cat room
		await test.step('Expect to have exported PDF in rocket.cat', async () => {
			await page.waitForTimeout(3000);
			await agent.poHomeChannel.sidenav.openChat('rocket.cat');
			await expect(agent.poHomeChannel.transcript.DownloadedPDF).toBeVisible();
		});

		// PDF can be exported from Omnichannel Contact Center
		await test.step('Expect to have exported PDF in rocket.cat', async () => {
			await agent.poHomeChannel.transcript.contactCenter.click();
			await agent.poHomeChannel.transcript.contactCenterChats.click();
			await agent.poHomeChannel.transcript.contactCenterSearch.type(newUser.name);
			await page.waitForTimeout(3000);
			await agent.poHomeChannel.transcript.firstRow.click();
			await agent.poHomeChannel.transcript.viewFullConversation.click();
			await agent.poHomeChannel.content.btnSendTranscript.click();
			await expect(agent.poHomeChannel.content.btnSendTranscriptAsPDF).toHaveAttribute('aria-disabled', 'false');
			await agent.poHomeChannel.content.btnSendTranscriptAsPDF.click();
			await expect(agent.poHomeChannel.toastSuccess).toBeVisible();
		});
	});
});
