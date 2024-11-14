import type { Page } from '@playwright/test';

import { createFakeVisitor } from '../../mocks/data';
import { ADMIN_CREDENTIALS, IS_EE } from '../config/constants';
import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { OmnichannelLiveChat, HomeChannel } from '../page-objects';
import { setSettingValueById } from '../utils';
import { createAgent, deleteAgent } from '../utils/omnichannel/agents';
import { createManager, deleteManager } from '../utils/omnichannel/managers';
import { getPriorityByi18nLabel } from '../utils/omnichannel/priority';
import { deleteClosedRooms } from '../utils/omnichannel/rooms';
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

test.describe('OC - Priorities & SLAs', () => {
	test.skip(!IS_EE, 'Enterprise Only');

	let poLiveChat: OmnichannelLiveChat;
	let visitor: { email: string; name: string };

	let agent: { page: Page; poHomeChannel: HomeChannel };

	test.beforeAll(async ({ api, browser }) => {
		await createAgent(api, ADMIN_CREDENTIALS.username);

		await createManager(api, ADMIN_CREDENTIALS.username);

		await setSettingValueById(api, 'Livechat_Routing_Method', 'Manual_Selection');

		const { page } = await createAuxContext(browser, Users.admin);
		agent = { page, poHomeChannel: new HomeChannel(page) };

		await agent.poHomeChannel.sidenav.switchStatus('online');
	});

	test.beforeEach(async ({ page, api }) => {
		visitor = createFakeVisitor();
		poLiveChat = new OmnichannelLiveChat(page, api);
		await page.goto('/livechat');
	});

	test.beforeEach(async () => {
		await poLiveChat.startChat({ visitor });
		await agent.poHomeChannel.sidenav.getQueuedChat(visitor.name).click();
	});

	test.afterEach(async () => {
		await poLiveChat.closeChat();
	});

	test.afterAll(async ({ api }) => {
		await Promise.all([
			deleteClosedRooms(api),
			deleteAgent(api, ADMIN_CREDENTIALS.username),
			deleteManager(api, ADMIN_CREDENTIALS.username),
			setSettingValueById(api, 'Livechat_Routing_Method', 'Auto_Selection'),
		]);

		await agent.page.close();
	});

	test('OC - Priorities & SLAs - Change room priority', async ({ api }) => {
		await test.step('expect to change priority of room and corresponding system message should be displayed', async () => {
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
	});

	test('OC - Priorities & SLAs - Change room SLA', async ({ api }) => {
		await test.step('expect to change SLA of room and corresponding system message should be displayed', async () => {
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
});
