import type { Page } from '@playwright/test';

import { IS_EE } from './config/constants';
import { createAuxContext } from './fixtures/createAuxContext';
import type { IUserState } from './fixtures/userStates';
import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel, deleteChannel, setSettingValueById } from './utils';
import { expect, test } from './utils/test';
import type { ITestUser } from './utils/user-helpers';
import { createTestUser, loginTestUser } from './utils/user-helpers';

test.use({ storageState: Users.admin.state });

test.describe.serial('read-receipts-deactivated-users', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: string;
	let user1Context: { page: Page; poHomeChannel: HomeChannel } | undefined;
	let user2Context: { page: Page; poHomeChannel: HomeChannel } | undefined;
	let testUser1: ITestUser;
	let testUser2: ITestUser;
	let testUser1State: IUserState;
	let testUser2State: IUserState;

	test.skip(!IS_EE, 'Enterprise Only');

	test.beforeAll(async ({ api }) => {
		testUser1 = await createTestUser(api);
		testUser2 = await createTestUser(api);

		[testUser1State, testUser2State] = await Promise.all([loginTestUser(api, testUser1), loginTestUser(api, testUser2)]);

		targetChannel = await createTargetChannel(api, { members: [testUser1.data.username, testUser2.data.username] });
		await setSettingValueById(api, 'Message_Read_Receipt_Enabled', true);
		await setSettingValueById(api, 'Message_Read_Receipt_Store_Users', true);
	});

	test.afterAll(async ({ api }) => {
		await setSettingValueById(api, 'Message_Read_Receipt_Enabled', false);
		await setSettingValueById(api, 'Message_Read_Receipt_Store_Users', false);

		await deleteChannel(api, targetChannel);
		await Promise.all([testUser1?.delete(), testUser2?.delete()]);
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		await page.goto('/home');
	});

	test.afterEach(async () => {
		if (user1Context) {
			await user1Context.page.close();
		}
		if (user2Context) {
			await user2Context.page.close();
		}
		user1Context = undefined;
		user2Context = undefined;
	});

	test('should correctly handle read receipts as users are deactivated', async ({ browser, api, page }) => {
		const { page: page1 } = await createAuxContext(browser, testUser1State);
		const user1Ctx = { page: page1, poHomeChannel: new HomeChannel(page1) };
		user1Context = user1Ctx;

		const { page: page2 } = await createAuxContext(browser, testUser2State);
		const user2Ctx = { page: page2, poHomeChannel: new HomeChannel(page2) };
		user2Context = user2Ctx;

		await poHomeChannel.navbar.openChat(targetChannel);
		await user1Ctx.poHomeChannel.navbar.openChat(targetChannel);
		await user2Ctx.poHomeChannel.navbar.openChat(targetChannel);

		await test.step('when all users are active', async () => {
			await poHomeChannel.content.sendMessage('Message 1: All three users active');

			await expect(user1Ctx.poHomeChannel.content.lastUserMessage).toBeVisible();
			await expect(user2Ctx.poHomeChannel.content.lastUserMessage).toBeVisible();

			await expect(poHomeChannel.content.lastUserMessage.getByRole('status', { name: 'Message viewed' })).toBeVisible();

			await poHomeChannel.content.openLastMessageMenu();
			await page.locator('role=menuitem[name="Read receipts"]').click();
			await expect(page.getByRole('dialog').getByRole('listitem')).toHaveCount(3);
			await page.getByRole('button', { name: 'Close' }).click();
		});

		await test.step('when some users are deactivated', async () => {
			await api.post('/users.setActiveStatus', { userId: testUser1.data._id, activeStatus: false });

			await poHomeChannel.content.sendMessage('Message 2: User1 deactivated, two active users');

			await expect(user2Ctx.poHomeChannel.content.lastUserMessage).toBeVisible();

			await expect(poHomeChannel.content.lastUserMessage.getByRole('status', { name: 'Message viewed' })).toBeVisible();

			await poHomeChannel.content.openLastMessageMenu();
			await page.locator('role=menuitem[name="Read receipts"]').click();
			await expect(page.getByRole('dialog').getByRole('listitem')).toHaveCount(2);
			await page.getByRole('button', { name: 'Close' }).click();
		});

		await test.step('when only one user remains active (user alone in room)', async () => {
			await api.post('/users.setActiveStatus', { userId: testUser2.data._id, activeStatus: false });

			await poHomeChannel.content.sendMessage('Message 3: Only admin active');

			await expect(poHomeChannel.content.lastUserMessage.getByRole('status', { name: 'Message viewed' })).toBeVisible();

			await poHomeChannel.content.openLastMessageMenu();
			await page.locator('role=menuitem[name="Read receipts"]').click();
			await expect(page.getByRole('dialog').getByRole('listitem')).toHaveCount(1);
			await page.getByRole('button', { name: 'Close' }).click();
		});
	});
});
