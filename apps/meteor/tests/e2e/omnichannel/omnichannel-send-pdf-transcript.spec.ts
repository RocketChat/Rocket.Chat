import type { Page } from '@playwright/test';

import { IS_EE } from '../config/constants';
import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { HomeOmnichannel } from '../page-objects';
import { createConversation } from '../utils/omnichannel/rooms';
import { test, expect } from '../utils/test';

test.skip(!IS_EE, 'Export transcript as PDF > Enterprie Only');

test.describe('omnichannel- export chat transcript as PDF', () => {
	let conversation: Awaited<ReturnType<typeof createConversation>>;

	let agent: { page: Page; poHomeChannel: HomeOmnichannel };
	test.beforeAll(async ({ api, browser }) => {
		// Set user user 1 as manager and agent
		await api.post('/livechat/users/agent', { username: 'user1' });
		await api.post('/livechat/users/manager', { username: 'user1' });

		const { page } = await createAuxContext(browser, Users.user1);
		agent = { page, poHomeChannel: new HomeOmnichannel(page) };
	});

	test.afterAll(async ({ api }) => {
		await api.delete('/livechat/users/agent/user1');
		await api.delete('/livechat/users/manager/user1');
		await agent.page.close();
		await conversation?.delete();
	});

	test('Export PDF transcript', async ({ page, api }) => {
		conversation = await createConversation(api, { agentId: 'user1' });

		await test.step('Expect to have 1 omnichannel assigned to agent 1', async () => {
			await agent.poHomeChannel.gotoLive(conversation.data.room._id);
		});

		await test.step('Expect to be not able send transcript as PDF', async () => {
			await agent.poHomeChannel.content.btnSendTranscript.click();
			await agent.poHomeChannel.content.btnSendTranscriptAsPDF.hover();
			await expect(agent.poHomeChannel.content.btnSendTranscriptAsPDF).toHaveAttribute('aria-disabled', 'true');
		});

		await test.step('Expect chat to be closed', async () => {
			await agent.poHomeChannel.quickActionsRoomToolbar.closeChat({ downloadPDF: true });
		});

		// Exported PDF can be downloaded from rocket.cat room
		await test.step('Expect to have exported PDF in rocket.cat', async () => {
			await agent.poHomeChannel.gotoDirect('rocket.cat');
			await expect(agent.poHomeChannel.content.lastUserMessage.getByText('PDF transcript successfully generated')).toBeVisible({
				timeout: 15000,
			});
			await expect(agent.poHomeChannel.content.lastUserMessage.getByRole('link', { name: 'Transcript' })).toBeVisible();
		});

		// PDF can be exported from Omnichannel Contact Center
		await test.step('Expect to have exported PDF in rocket.cat', async () => {
			await agent.poHomeChannel.navbar.btnContactCenter.click();
			await agent.poHomeChannel.transcript.contactCenterChats.click();
			await agent.poHomeChannel.transcript.contactCenterSearch.type(conversation.data.visitor.name);
			await page.waitForTimeout(3000);
			await agent.poHomeChannel.transcript.firstRow.click();
			await agent.poHomeChannel.transcript.btnOpenChat.click();
			await agent.poHomeChannel.content.btnSendTranscript.click();
			await expect(agent.poHomeChannel.content.btnSendTranscriptAsPDF).toHaveAttribute('aria-disabled', 'false');
			await agent.poHomeChannel.content.btnSendTranscriptAsPDF.click();
			await agent.poHomeChannel.toastMessage.waitForDisplay();
		});
	});
});
