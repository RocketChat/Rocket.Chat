import { faker } from '@faker-js/faker';

import { IS_EE } from '../config/constants';
import { Users } from '../fixtures/userStates';
import { HomeOmnichannel } from '../page-objects';
import { OmnichannelRoomInfo } from '../page-objects/omnichannel-room-info';
import { createConversation } from '../utils/omnichannel/rooms';
import { test, expect } from '../utils/test';

const NEW_USER = {
	name: faker.person.firstName(),
	email: faker.internet.email(),
};

const getPrioritySystemMessage = (username: string, priority: string) =>
	`Priority changed: ${username} changed the priority to ${priority}`;

test.skip(!IS_EE, 'Omnichannel Priorities > Enterprise Only');

test.use({ storageState: Users.user1.state });

test.describe.serial('OC - Priorities [Sidebar]', () => {
	let poHomeChannel: HomeOmnichannel;
	let poRoomInfo: OmnichannelRoomInfo;

	test.beforeAll(async ({ api }) => {
		(
			await Promise.all([
				api.post('/livechat/users/agent', { username: 'user1' }),
				api.post('/livechat/users/manager', { username: 'user1' }),
				api.post('/settings/Livechat_Routing_Method', { value: 'Manual_Selection' }),
			])
		).every((res) => expect(res.status()).toBe(200));
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeOmnichannel(page);
		poRoomInfo = new OmnichannelRoomInfo(page);
	});

	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await page.locator('.main-content').waitFor();
	});

	test.beforeEach(async ({ api }) => {
		await createConversation(api, { visitorName: NEW_USER.name });
	});

	test.afterAll(async ({ api }) => {
		(
			await Promise.all([
				api.delete('/livechat/users/agent/user1'),
				api.delete('/livechat/users/manager/user1'),
				api.post('/settings/Livechat_Routing_Method', { value: 'Auto_Selection' }),
			])
		).every((res) => expect(res.status()).toBe(200));
	});

	test('OC - Priorities [Sidebar] - Update conversation priority', async ({ page }) => {
		const systemMessage = poHomeChannel.content.lastSystemMessageBody;
		await page.emulateMedia({ reducedMotion: 'reduce' });

		await test.step('expect to change inquiry priority using sidebar menu', async () => {
			await poHomeChannel.sidenav.getSidebarItemByName(NEW_USER.name).click();

			await expect(poRoomInfo.getLabel('Priority')).not.toBeVisible();

			await poHomeChannel.sidenav.selectPriority(NEW_USER.name, 'Lowest');
			await systemMessage.locator(`text="${getPrioritySystemMessage('user1', 'Lowest')}"`).waitFor();
			await expect(poRoomInfo.getLabel('Priority')).toBeVisible();
			await expect(poRoomInfo.getInfo('Lowest')).toBeVisible();

			await poHomeChannel.sidenav.selectPriority(NEW_USER.name, 'Highest');
			await systemMessage.locator(`text="${getPrioritySystemMessage('user1', 'Highest')}"`).waitFor();
			await expect(poRoomInfo.getInfo('Highest')).toBeVisible();

			await poHomeChannel.sidenav.selectPriority(NEW_USER.name, 'Unprioritized');
			await systemMessage.locator(`text="${getPrioritySystemMessage('user1', 'Unprioritized')}"`).waitFor();
			await expect(poRoomInfo.getLabel('Priority')).not.toBeVisible();
			await expect(poRoomInfo.getInfo('Unprioritized')).not.toBeVisible();
		});

		await test.step('expect to change subscription priority using sidebar menu', async () => {
			await poHomeChannel.content.btnTakeChat.click();
			await systemMessage.locator('text="joined the channel"').waitFor();
			await page.waitForTimeout(500);

			await expect(poRoomInfo.getLabel('Priority')).not.toBeVisible();

			await poHomeChannel.sidenav.selectPriority(NEW_USER.name, 'Lowest');
			await systemMessage.locator(`text="${getPrioritySystemMessage('user1', 'Lowest')}"`).waitFor();
			await expect(poRoomInfo.getLabel('Priority')).toBeVisible();
			await expect(poRoomInfo.getInfo('Lowest')).toBeVisible();

			await poHomeChannel.sidenav.selectPriority(NEW_USER.name, 'Highest');
			await systemMessage.locator(`text="${getPrioritySystemMessage('user1', 'Highest')}"`).waitFor();
			await expect(poRoomInfo.getInfo('Highest')).toBeVisible();

			await poHomeChannel.sidenav.selectPriority(NEW_USER.name, 'Unprioritized');
			await systemMessage.locator(`text="${getPrioritySystemMessage('user1', 'Unprioritized')}"`).waitFor();
			await expect(poRoomInfo.getLabel('Priority')).not.toBeVisible();
			await expect(poRoomInfo.getInfo('Unprioritized')).not.toBeVisible();
		});
	});
});
