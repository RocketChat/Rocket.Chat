import { createFakeVisitor } from '../../mocks/data';
import { IS_EE } from '../config/constants';
import { Users } from '../fixtures/userStates';
import { HomeOmnichannel } from '../page-objects';
import { OmnichannelRoomInfo } from '../page-objects/omnichannel-room-info';
import { setSettingValueById } from '../utils';
import { createAgent, deleteAgent } from '../utils/omnichannel/agents';
import { createManager, deleteManager } from '../utils/omnichannel/managers';
import { createConversation } from '../utils/omnichannel/rooms';
import { test, expect } from '../utils/test';

const visitor = createFakeVisitor();

const getPrioritySystemMessage = (username: string, priority: string) =>
	`Priority changed: ${username} changed the priority to ${priority}`;

test.skip(!IS_EE, 'Omnichannel Priorities > Enterprise Only');

test.use({ storageState: Users.user1.state });

test.describe.serial('OC - Priorities [Sidebar]', () => {
	let poHomeChannel: HomeOmnichannel;
	let poRoomInfo: OmnichannelRoomInfo;
	let conversation: Awaited<ReturnType<typeof createConversation>>;

	test.beforeAll(async ({ api }) => {
		await Promise.all([
			createAgent(api, 'user1'),
			createManager(api, 'user1'),
			setSettingValueById(api, 'Livechat_Routing_Method', 'Manual_Selection'),
		]);
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
		conversation = await createConversation(api, { visitorName: visitor.name });
	});

	test.afterEach(async () => {
		await conversation.delete();
	});

	test.afterAll(async ({ api }) => {
		await Promise.all([
			deleteAgent(api, 'user1'),
			deleteManager(api, 'user1'),
			setSettingValueById(api, 'Livechat_Routing_Method', 'Auto_Selection'),
		]);
	});

	test('OC - Priorities [Sidebar] - Update conversation priority', async ({ page }) => {
		const systemMessage = poHomeChannel.content.lastSystemMessageBody;
		await page.emulateMedia({ reducedMotion: 'reduce' });

		await test.step('expect to change inquiry priority using sidebar menu', async () => {
			await poHomeChannel.sidenav.getSidebarItemByName(visitor.name).click();
			await expect(poHomeChannel.content.btnTakeChat).toBeVisible();

			await expect(poRoomInfo.getLabel('Priority')).not.toBeVisible();

			await poHomeChannel.sidenav.selectPriority(visitor.name, 'Lowest');
			await systemMessage.locator(`text="${getPrioritySystemMessage('user1', 'Lowest')}"`).waitFor();
			await expect(poRoomInfo.getLabel('Priority')).toBeVisible();
			await expect(poRoomInfo.getInfo('Lowest')).toBeVisible();

			await poHomeChannel.sidenav.selectPriority(visitor.name, 'Highest');
			await systemMessage.locator(`text="${getPrioritySystemMessage('user1', 'Highest')}"`).waitFor();
			await expect(poRoomInfo.getInfo('Highest')).toBeVisible();

			await poHomeChannel.sidenav.selectPriority(visitor.name, 'Unprioritized');
			await systemMessage.locator(`text="${getPrioritySystemMessage('user1', 'Unprioritized')}"`).waitFor();
			await expect(poRoomInfo.getLabel('Priority')).not.toBeVisible();
			await expect(poRoomInfo.getInfo('Unprioritized')).not.toBeVisible();
		});

		await test.step('expect to change subscription priority using sidebar menu', async () => {
			await poHomeChannel.content.btnTakeChat.click();
			await systemMessage.locator('text="joined the channel"').waitFor();
			await page.waitForTimeout(500);

			await expect(poRoomInfo.getLabel('Priority')).not.toBeVisible();

			await poHomeChannel.sidenav.selectPriority(visitor.name, 'Lowest');
			await systemMessage.locator(`text="${getPrioritySystemMessage('user1', 'Lowest')}"`).waitFor();
			await expect(poRoomInfo.getLabel('Priority')).toBeVisible();
			await expect(poRoomInfo.getInfo('Lowest')).toBeVisible();

			await poHomeChannel.sidenav.selectPriority(visitor.name, 'Highest');
			await systemMessage.locator(`text="${getPrioritySystemMessage('user1', 'Highest')}"`).waitFor();
			await expect(poRoomInfo.getInfo('Highest')).toBeVisible();

			await poHomeChannel.sidenav.selectPriority(visitor.name, 'Unprioritized');
			await systemMessage.locator(`text="${getPrioritySystemMessage('user1', 'Unprioritized')}"`).waitFor();
			await expect(poRoomInfo.getLabel('Priority')).not.toBeVisible();
			await expect(poRoomInfo.getInfo('Unprioritized')).not.toBeVisible();
		});
	});
});
