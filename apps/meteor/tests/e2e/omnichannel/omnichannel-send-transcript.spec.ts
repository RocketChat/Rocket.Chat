import type { Page } from '@playwright/test';

import { IS_EE } from '../config/constants';
import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { HomeChannel } from '../page-objects';
import { createConversation } from '../utils/omnichannel/rooms';
import { test, expect } from '../utils/test';

test.describe('omnichannel-transcript', () => {
	let conversation: Awaited<ReturnType<typeof createConversation>>;

	let agent: { page: Page; poHomeChannel: HomeChannel };
	test.beforeAll(async ({ api, browser }) => {
		// Set user user 1 as manager and agent
		await api.post('/livechat/users/agent', { username: 'user1' });
		await api.post('/livechat/users/manager', { username: 'user1' });

		const { page } = await createAuxContext(browser, Users.user1);
		agent = { page, poHomeChannel: new HomeChannel(page) };
	});

	test.afterAll(async ({ api }) => {
		await api.delete('/livechat/users/agent/user1');
		await api.delete('/livechat/users/manager/user1');
		await agent.page.close();
		await conversation?.delete();
	});

	test('Receiving a message from visitor', async ({ api }) => {
		conversation = await createConversation(api, { agentId: 'user1' });

		await test.step('Expect to have 1 omnichannel assigned to agent 1', async () => {
			await agent.poHomeChannel.goto();
			await agent.poHomeChannel.navbar.openChat(conversation.data.visitor.name);
		});

		await test.step('Expect to be able to send transcript to email', async () => {
			await agent.poHomeChannel.content.btnSendTranscript.click();
			await agent.poHomeChannel.content.btnSendTranscriptToEmail.click();
			await agent.poHomeChannel.content.btnModalConfirm.click();
			await agent.poHomeChannel.toastMessage.waitForDisplay();
		});

		await test.step('Expect to be not able send transcript as PDF', async () => {
			test.skip(!IS_EE, 'Enterprise Only');
			await agent.poHomeChannel.content.btnSendTranscript.click();
			await agent.poHomeChannel.content.btnSendTranscriptAsPDF.hover();
			await expect(agent.poHomeChannel.content.btnSendTranscriptAsPDF).toHaveAttribute('aria-disabled', 'true');
		});
	});
});
