import { faker } from '@faker-js/faker';
import type { Page } from '@playwright/test';

import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { ReportMessageModal } from './page-objects/fragments';
import { createTargetChannelAndReturnFullRoom, deleteRoom, sendMessage } from './utils';
import { test, expect } from './utils/test';

test.use({ storageState: Users.user1.state });

test.describe.serial('report message', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: string;
	let targetChannelId: string;
	let adminPage: Page;
	let adminHomeChannel: HomeChannel;
	let reportModal: ReportMessageModal;

	test.beforeAll(async ({ api, browser }) => {
		const { channel } = await createTargetChannelAndReturnFullRoom(api, { members: ['user1', 'admin'] });
		targetChannel = channel.name!;
		targetChannelId = channel._id;
		adminPage = await browser.newPage({ storageState: Users.admin.state });
		adminHomeChannel = new HomeChannel(adminPage);
		reportModal = new ReportMessageModal(adminPage);
	});

	test.afterAll(async ({ api }) => {
		await Promise.all([
			api.post('/moderation.user.deleteReportedMessages', {
				userId: 'user1',
			}),
			deleteRoom(api, targetChannelId),
			adminPage.close(),
		]);
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		await adminPage.goto('/home');
	});

	test('should show report message option in message menu for other users messages', async ({ api }) => {
		await sendMessage(api, targetChannelId, faker.lorem.sentence(), { asUser: Users.user1 });

		await adminHomeChannel.navbar.openChat(targetChannel);
		await adminHomeChannel.content.openLastMessageMenu();
		await expect(adminPage.getByRole('menuitem', { name: 'Report' })).toBeVisible();
	});

	test('should not show report message option in message menu for own messages', async ({ api, page }) => {
		await sendMessage(api, targetChannelId, faker.lorem.sentence(), { asUser: Users.user1 });

		await page.goto('/home');
		await poHomeChannel.navbar.openChat(targetChannel);
		await poHomeChannel.content.openLastMessageMenu();
		await expect(page.getByRole('menuitem', { name: 'Report' })).not.toBeVisible();
	});

	test('should validate empty report description', async ({ api }) => {
		await sendMessage(api, targetChannelId, faker.lorem.sentence(), { asUser: Users.user1 });

		await adminHomeChannel.navbar.openChat(targetChannel);
		await adminHomeChannel.content.openLastMessageMenu();
		await adminPage.getByRole('menuitem', { name: 'Report' }).click();
		await reportModal.submitReport();
	});

	test('should be able to cancel reporting a message', async ({ api }) => {
		await sendMessage(api, targetChannelId, faker.lorem.sentence(), { asUser: Users.user1 });

		await adminHomeChannel.navbar.openChat(targetChannel);
		await adminHomeChannel.content.openLastMessageMenu();
		await adminPage.getByRole('menuitem', { name: 'Report' }).click();
		await reportModal.cancelReport();
	});

	test('should successfully report a message and verify its appearance in moderation console', async ({ api }) => {
		const testMessage = faker.lorem.sentence();
		const reportDescription = faker.lorem.sentence();

		await sendMessage(api, targetChannelId, testMessage, { asUser: Users.user1 });

		await adminHomeChannel.navbar.openChat(targetChannel);
		await adminHomeChannel.content.openLastMessageMenu();
		await adminPage.getByRole('menuitem', { name: 'Report' }).click();
		await reportModal.submitReport(reportDescription);

		await adminPage.goto('/admin/moderation/messages');

		await expect(adminPage.getByRole('tab', { name: 'Reported messages' })).toBeVisible();
		await expect(adminPage.getByRole('link', { name: 'user1' })).toBeVisible();
		await adminPage.getByRole('link', { name: 'user1' }).click();

		await expect(adminPage.getByText(testMessage)).toBeVisible();

		await adminPage.getByRole('button', { name: 'Show reports' }).click();
		await expect(adminPage.getByText(reportDescription)).toBeVisible();
	});
});
