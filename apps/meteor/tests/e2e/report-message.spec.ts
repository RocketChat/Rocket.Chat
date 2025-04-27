import { faker } from '@faker-js/faker';
import type { Page } from '@playwright/test';

import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { ReportMessageModal } from './page-objects/fragments';
import { createTargetChannel, deleteChannel } from './utils';
import { test, expect } from './utils/test';

test.use({ storageState: Users.user1.state });

test.describe.serial('report message', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: string;
	let adminPage: Page;
	let reportModal: ReportMessageModal;

	test.beforeAll(async ({ api, browser }) => {
		targetChannel = await createTargetChannel(api, { members: ['user1', 'admin'] });
		adminPage = await browser.newPage({ storageState: Users.admin.state });
		reportModal = new ReportMessageModal(adminPage);
	});

	test.afterAll(async ({ api }) => {
		await Promise.all([
			api.post('/moderation.user.deleteReportedMessages', {
				userId: 'user1',
			}),
			deleteChannel(api, targetChannel),
			adminPage.close(),
		]);
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
		await adminPage.goto('/home');
	});

	test('should show report message option in message menu for other users messages', async () => {
		await test.step('send message as user1', async () => {
			await poHomeChannel.sidenav.openChat(targetChannel);
			const testMessage = faker.lorem.sentence();
			await poHomeChannel.content.sendMessage(testMessage);
		});

		await test.step('verify report option is visible for the other user', async () => {
			const adminHomeChannel = new HomeChannel(adminPage);
			await adminHomeChannel.sidenav.openChat(targetChannel);
			await adminHomeChannel.content.openLastMessageMenu();
			await expect(adminPage.getByRole('menuitem', { name: 'Report' })).toBeVisible();
		});
	});

	test('should not show report message option in message menu for own messages', async ({ page }) => {
		await test.step('send message as user1', async () => {
			await poHomeChannel.sidenav.openChat(targetChannel);
			const testMessage = faker.lorem.sentence();
			await poHomeChannel.content.sendMessage(testMessage);
		});

		await test.step('verify report option is not visible for own message', async () => {
			await poHomeChannel.content.openLastMessageMenu();
			await expect(page.getByRole('menuitem', { name: 'Report' })).not.toBeVisible();
		});
	});

	test('should validate empty report description', async () => {
		await test.step('send message as user1', async () => {
			await poHomeChannel.sidenav.openChat(targetChannel);
			const testMessage = faker.lorem.sentence();
			await poHomeChannel.content.sendMessage(testMessage);
		});

		await test.step('try to submit empty report', async () => {
			const adminHomeChannel = new HomeChannel(adminPage);
			await adminHomeChannel.sidenav.openChat(targetChannel);

			await adminHomeChannel.content.openLastMessageMenu();
			await adminPage.getByRole('menuitem', { name: 'Report' }).click();

			await reportModal.btnSubmitReport.click();
			await expect(reportModal.reportDescriptionError).toBeVisible();
		});
	});

	test('should be able to cancel reporting a message', async () => {
		await test.step('send message as user1', async () => {
			await poHomeChannel.sidenav.openChat(targetChannel);
			const testMessage = faker.lorem.sentence();
			await poHomeChannel.content.sendMessage(testMessage);
		});

		await test.step('open and cancel report modal', async () => {
			const adminHomeChannel = new HomeChannel(adminPage);
			await adminHomeChannel.sidenav.openChat(targetChannel);

			await adminHomeChannel.content.openLastMessageMenu();
			await adminPage.getByRole('menuitem', { name: 'Report' }).click();

			await expect(reportModal.modalTitle).toBeVisible();
			await reportModal.btnCancelReport.click();
			await expect(reportModal.modalTitle).not.toBeVisible();
		});
	});

	test('should successfully report a message and verify its appearance in moderation console', async () => {
		let testMessage: string;
		let reportDescription: string;

		await test.step('send message as user1', async () => {
			await poHomeChannel.sidenav.openChat(targetChannel);
			testMessage = faker.lorem.sentence();
			await poHomeChannel.content.sendMessage(testMessage);
		});

		await test.step('report message as the other user', async () => {
			const adminHomeChannel = new HomeChannel(adminPage);
			await adminHomeChannel.sidenav.openChat(targetChannel);

			await adminHomeChannel.content.openLastMessageMenu();
			await adminPage.getByRole('menuitem', { name: 'Report' }).click();

			reportDescription = faker.lorem.sentence();
			await reportModal.inputReportDescription.fill(reportDescription);

			await reportModal.btnSubmitReport.click();

			await expect(adminPage.getByText('Report has been sent')).toBeVisible();
		});

		await test.step('verify report in moderation console', async () => {
			await adminPage.goto('/admin/moderation/messages');

			await expect(adminPage.getByRole('tab', { name: 'Reported messages' })).toBeVisible();
			await expect(adminPage.getByRole('link', { name: 'user1' })).toBeVisible();
			await adminPage.getByRole('link', { name: 'user1' }).click();

			await expect(adminPage.getByText(testMessage)).toBeVisible();

			await adminPage.getByRole('button', { name: 'Show reports' }).click();
			await expect(adminPage.getByText(reportDescription)).toBeVisible();
		});
	});
});
