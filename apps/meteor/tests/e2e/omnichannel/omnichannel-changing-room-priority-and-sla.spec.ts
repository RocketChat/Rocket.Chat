import type { Page } from '@playwright/test';

import { ADMIN_CREDENTIALS, IS_EE } from '../config/constants';
import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { HomeChannel } from '../page-objects';
import { makeAgentAvailable } from '../utils/omnichannel/agents';
import { getPriorityByi18nLabel } from '../utils/omnichannel/priority';
import { createConversation } from '../utils/omnichannel/rooms';
import { createSLA } from '../utils/omnichannel/sla';
import { test, expect } from '../utils/test';

test.describe.serial('omnichannel-changing-room-priority-and-sla', () => {
	test.skip(!IS_EE, 'Enterprise Only');

	let conversation: Awaited<ReturnType<typeof createConversation>>;

	let agent: { page: Page; poHomeChannel: HomeChannel };

	test.beforeAll(async ({ api, browser }) => {
		let statusCode = (await api.post('/livechat/users/agent', { username: ADMIN_CREDENTIALS.username })).status();
		expect(statusCode).toBe(200);

		statusCode = (await api.post('/livechat/users/manager', { username: ADMIN_CREDENTIALS.username })).status();
		expect(statusCode).toBe(200);

		statusCode = (await makeAgentAvailable(api, Users.admin.data._id)).status();
		expect(statusCode).toBe(200);

		statusCode = (await api.post('/settings/Livechat_Routing_Method', { value: 'Manual_Selection' })).status();
		expect(statusCode).toBe(200);

		const { page } = await createAuxContext(browser, Users.admin);
		agent = { page, poHomeChannel: new HomeChannel(page) };

		conversation = await createConversation(api);
		await agent.poHomeChannel.goto();
		await agent.poHomeChannel.navbar.openChat(conversation.data.visitor.name);
	});

	test.afterAll(async ({ api }) => {
		await agent.page.close();
		await conversation?.delete();

		await Promise.all([
			api.delete(`/livechat/users/agent/${ADMIN_CREDENTIALS.username}`),
			api.delete(`/livechat/users/manager/${ADMIN_CREDENTIALS.username}`),
			api.post('/settings/Livechat_Routing_Method', { value: 'Auto_Selection' }),
		]);
	});

	test('expect to change priority of room and corresponding system message should be displayed', async ({ api }) => {
		const priority = await getPriorityByi18nLabel(api, 'High');

		await test.step('change priority of room to the new priority', async () => {
			const status = (await api.post(`/livechat/room/${conversation.data.room._id}/priority`, { priorityId: priority._id })).status();
			await expect(status).toBe(200);
		});

		await expect(agent.poHomeChannel.content.lastSystemMessageBody).toHaveText(
			`Priority changed: ${ADMIN_CREDENTIALS.username} changed the priority to ${priority.name || priority.i18n}`,
		);
	});

	test('expect to change SLA of room and corresponding system message should be displayed', async ({ api }) => {
		const sla = await createSLA(api);

		await test.step('change SLA of room to the new SLA', async () => {
			const status = (await api.put(`/livechat/inquiry.setSLA`, { sla: sla.name, roomId: conversation.data.room._id })).status();
			expect(status).toBe(200);
		});

		await expect(agent.poHomeChannel.content.lastSystemMessageBody).toHaveText(
			`SLA policy changed: ${ADMIN_CREDENTIALS.username} changed the SLA policy to ${sla.name}`,
		);

		await test.step('cleanup SLA', async () => {
			const status = (await api.delete(`/livechat/sla/${sla._id}`)).status();
			expect(status).toBe(200);
		});
	});
});
