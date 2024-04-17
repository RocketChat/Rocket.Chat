import { faker } from '@faker-js/faker';
import type { Page } from '@playwright/test';

import { ADMIN_CREDENTIALS, IS_EE } from '../config/constants';
import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { OmnichannelLiveChat, HomeChannel } from '../page-objects';
import { getPriorityByi18nLabel } from '../utils/omnichannel/priority';
import { createSLA } from '../utils/omnichannel/sla';
import { test, expect } from '../utils/test';

const getRoomId = (page: Page): string => {
	// url is of the form: http://localhost:3000/live/:rid/room-info
	const url = page?.url();
	// rid comes after /live/ and before /room-info (or /)
	const rid = url?.split('/live/')[1].split('/')[0];
	if (!rid) {
		throw new Error(`Could not get room id from url: ${page.url()}`);
	}
	return rid;
};

test.describe.serial('omnichannel-changing-room-priority-and-sla', () => {
	test.skip(!IS_EE, 'Enterprise Only');

	let poLiveChat: OmnichannelLiveChat;
	let newVisitor: { email: string; name: string };

	let agent: { page: Page; poHomeChannel: HomeChannel };

	test.beforeAll(async ({ api, browser }) => {
		let statusCode = (await api.post('/livechat/users/agent', { username: ADMIN_CREDENTIALS.username })).status();
		await expect(statusCode).toBe(200);

		statusCode = (await api.post('/livechat/users/manager', { username: ADMIN_CREDENTIALS.username })).status();
		await expect(statusCode).toBe(200);

		statusCode = (await api.post('/settings/Livechat_Routing_Method', { value: 'Manual_Selection' })).status();
		await expect(statusCode).toBe(200);

		const { page } = await createAuxContext(browser, Users.admin);
		agent = { page, poHomeChannel: new HomeChannel(page) };

		await agent.poHomeChannel.sidenav.switchStatus('online');
	});

	test.afterAll(async ({ api }) => {
		let statusCode = (await api.delete(`/livechat/users/agent/${ADMIN_CREDENTIALS.username}`)).status();
		await expect(statusCode).toBe(200);

		statusCode = (await api.delete(`/livechat/users/manager/${ADMIN_CREDENTIALS.username}`)).status();
		await expect(statusCode).toBe(200);

		statusCode = (await api.post('/settings/Livechat_Routing_Method', { value: 'Auto_Selection' })).status();
		await expect(statusCode).toBe(200);

		await agent.page.close();
	});

	test('expect to initiate a new livechat conversation', async ({ page, api }) => {
		newVisitor = {
			name: faker.person.firstName(),
			email: faker.internet.email(),
		};
		poLiveChat = new OmnichannelLiveChat(page, api);
		await page.goto('/livechat');
		await poLiveChat.openLiveChat();
		await poLiveChat.sendMessage(newVisitor, false);
		await poLiveChat.onlineAgentMessage.type('this_a_test_message_from_user');
		await poLiveChat.btnSendMessageToOnlineAgent.click();

		await agent.poHomeChannel.sidenav.getQueuedChat(newVisitor.name).click();
	});

	test('expect to change priority of room and corresponding system message should be displayed', async ({ api }) => {
		const priority = await getPriorityByi18nLabel(api, 'High');

		await test.step('change priority of room to the new priority', async () => {
			const status = (await api.post(`/livechat/room/${getRoomId(agent.page)}/priority`, { priorityId: priority._id })).status();
			await expect(status).toBe(200);

			await agent.page.waitForTimeout(1000);
		});

		await expect(agent.poHomeChannel.content.lastSystemMessageBody).toHaveText(
			`Priority changed: ${ADMIN_CREDENTIALS.username} changed the priority to ${priority.name || priority.i18n}`,
		);
	});

	test('expect to change SLA of room and corresponding system message should be displayed', async ({ api }) => {
		const sla = await createSLA(api);

		await test.step('change SLA of room to the new SLA', async () => {
			const status = (await api.put(`/livechat/inquiry.setSLA`, { sla: sla.name, roomId: getRoomId(agent.page) })).status();
			expect(status).toBe(200);
			await agent.page.waitForTimeout(1000);
		});

		await expect(agent.poHomeChannel.content.lastSystemMessageBody).toHaveText(
			`SLA Policy changed: ${ADMIN_CREDENTIALS.username} changed the SLA Policy to ${sla.name}`,
		);

		await test.step('cleanup SLA', async () => {
			const status = (await api.delete(`/livechat/sla/${sla._id}`)).status();
			expect(status).toBe(200);
		});
	});
});
