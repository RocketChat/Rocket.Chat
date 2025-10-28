import {
	OmnichannelSortingMechanismSettingType,
	type IOmnichannelServiceLevelAgreements,
	type Serialized,
} from '@rocket.chat/core-typings';

import { createFakeVisitor } from '../../mocks/data';
import { IS_EE } from '../config/constants';
import { Users } from '../fixtures/userStates';
import { HomeOmnichannel } from '../page-objects';
import { OmnichannelRoomInfo } from '../page-objects/omnichannel-room-info';
import { createConversation } from '../utils/omnichannel/rooms';
import { createSLA } from '../utils/omnichannel/sla';
import { test, expect } from '../utils/test';

const visitorA = createFakeVisitor();
const visitorB = createFakeVisitor();
const visitorC = createFakeVisitor();

test.skip(!IS_EE, 'Omnichannel SLAs > Enterprise Only');

test.use({ storageState: Users.user1.state });

test.describe('OC - SLA Policies [Sidebar]', () => {
	let poHomeChannel: HomeOmnichannel;
	let poRoomInfo: OmnichannelRoomInfo;
	let conversations: Awaited<ReturnType<typeof createConversation>>[] = [];
	let slas: Serialized<Omit<IOmnichannelServiceLevelAgreements, '_updatedAt'>>[] = [];

	test.beforeAll('create SLAs', async ({ api }) => {
		slas = await Promise.all([
			createSLA(api, { name: 'Very Urgent', dueTimeInMinutes: 1 }),
			createSLA(api, { name: 'Urgent', dueTimeInMinutes: 10 }),
			createSLA(api, { name: 'Not Urgent', dueTimeInMinutes: 30 }),
		]);
	});

	test.beforeAll(async ({ api }) => {
		(
			await Promise.all([
				// Create agent and manager
				api.post('/livechat/users/agent', { username: 'user1' }),
				api.post('/livechat/users/manager', { username: 'user1' }),
				// Settings
				api.post('/settings/Livechat_Routing_Method', { value: 'Manual_Selection' }),
				api.post('/settings/Omnichannel_sorting_mechanism', { value: OmnichannelSortingMechanismSettingType.SLAs }),
			])
		).every((res) => expect(res.status()).toBe(200));
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeOmnichannel(page);
		poRoomInfo = new OmnichannelRoomInfo(page);
	});

	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await page.locator('#main-content').waitFor();
	});

	test.beforeEach(async ({ api }) => {
		conversations = await Promise.all([
			createConversation(api, { visitorName: visitorA.name, agentId: 'user1' }),
			createConversation(api, { visitorName: visitorB.name, agentId: 'user1' }),
			createConversation(api, { visitorName: visitorC.name, agentId: 'user1' }),
		]);
	});

	test.afterAll('delete SLAs', async ({ api }) => {
		const responses = await Promise.all(slas.map((sla) => api.delete(`/livechat/sla/${sla._id}`)));
		responses.every((res) => expect(res.status()).toBe(200));
	});

	test.afterAll(async ({ api }) => {
		// Delete conversations
		await Promise.all(conversations.map((conversation) => conversation.delete()));

		(
			await Promise.all([
				// Delete agent and manager
				api.delete('/livechat/users/agent/user1'),
				api.delete('/livechat/users/manager/user1'),
				// Reset settings
				api.post('/settings/Livechat_Routing_Method', { value: 'Auto_Selection' }),
				api.post('/settings/Omnichannel_sorting_mechanism', { value: OmnichannelSortingMechanismSettingType.Timestamp }),
			])
		).every((res) => expect(res.status()).toBe(200));
	});

	test('OC - SLA Policies [Sidebar] - Update conversation SLA Policy', async () => {
		await test.step('expect to change room SLA policy to "Not urgent"', async () => {
			await test.step('expect to open room and room info to be visible', async () => {
				await poHomeChannel.sidenav.getSidebarItemByName(visitorA.name).click();
				await expect(poRoomInfo.dialogRoomInfo).toBeVisible();
			});

			await test.step('expect to update room SLA policy', async () => {
				await expect(poRoomInfo.getInfoByLabel('SLA Policy')).not.toBeVisible();
				await poRoomInfo.btnEditRoomInfo.click();
				await poRoomInfo.selectSLA('Not Urgent');
				await poRoomInfo.btnSaveEditRoom.click();
			});

			await test.step('expect SLA to have been updated in the room info and queue order to be correct', async () => {
				await expect(poRoomInfo.getInfoByLabel('SLA Policy')).toHaveText('Not Urgent');
				await expect(poHomeChannel.sidenav.getSidebarListItemByName(visitorA.name)).toHaveAttribute('data-index', '1');
			});
		});

		await test.step('expect to change room SLA policy to "Urgent"', async () => {
			await test.step('expect to open room and room info to be visible', async () => {
				await poHomeChannel.sidenav.getSidebarItemByName(visitorB.name).click();
				await expect(poRoomInfo.dialogRoomInfo).toBeVisible();
			});

			await test.step('expect to update room SLA policy', async () => {
				await expect(poRoomInfo.getInfoByLabel('SLA Policy')).not.toBeVisible();
				await poRoomInfo.btnEditRoomInfo.click();
				await poRoomInfo.selectSLA('Urgent');
				await poRoomInfo.btnSaveEditRoom.click();
			});

			await test.step('expect SLA to have been updated in the room info and queue order to be correct', async () => {
				await expect(poRoomInfo.getInfoByLabel('SLA Policy')).toHaveText('Urgent');
				await expect(poHomeChannel.sidenav.getSidebarListItemByName(visitorB.name)).toHaveAttribute('data-index', '1');
				await expect(poHomeChannel.sidenav.getSidebarListItemByName(visitorA.name)).toHaveAttribute('data-index', '2');
			});
		});

		await test.step('expect to change room SLA policy to "Very Urgent"', async () => {
			await test.step('expect to open room and room info to be visible', async () => {
				await poHomeChannel.sidenav.getSidebarItemByName(visitorC.name).click();
				await expect(poRoomInfo.dialogRoomInfo).toBeVisible();
			});

			await test.step('expect to update room SLA policy', async () => {
				await expect(poRoomInfo.getInfoByLabel('SLA Policy')).not.toBeVisible();
				await poRoomInfo.btnEditRoomInfo.click();
				await poRoomInfo.selectSLA('Very Urgent');
				await poRoomInfo.btnSaveEditRoom.click();
			});

			await test.step('expect SLA to have been updated in the room info and queue order to be correct', async () => {
				await expect(poRoomInfo.getInfoByLabel('SLA Policy')).toHaveText('Very Urgent');
				await expect(poHomeChannel.sidenav.getSidebarListItemByName(visitorC.name)).toHaveAttribute('data-index', '1');
				await expect(poHomeChannel.sidenav.getSidebarListItemByName(visitorB.name)).toHaveAttribute('data-index', '2');
				await expect(poHomeChannel.sidenav.getSidebarListItemByName(visitorA.name)).toHaveAttribute('data-index', '3');
			});
		});
	});
});
