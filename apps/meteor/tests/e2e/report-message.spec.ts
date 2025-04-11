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
		await deleteChannel(api, targetChannel);
		await adminPage.close();
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
		await adminPage.goto('/home');
	});

	test('should show report message option in message menu for other users messages', async () => {
		await poHomeChannel.sidenav.openChat(targetChannel);
		const testMessage = faker.lorem.sentence();
		await poHomeChannel.content.sendMessage(testMessage);

		const adminHomeChannel = new HomeChannel(adminPage);

		await adminHomeChannel.sidenav.openChat(targetChannel);

		await adminHomeChannel.content.openLastMessageMenu();

		await expect(adminPage.getByRole('menuitem', { name: 'Report' })).toBeVisible();
	});

	test('should not show report message option in message menu for own messages', async ({ page }) => {
		await page.goto('/home');
		await poHomeChannel.sidenav.openChat(targetChannel);
		const testMessage = faker.lorem.sentence();
		await poHomeChannel.content.sendMessage(testMessage);

		await poHomeChannel.content.openLastMessageMenu();

		await expect(page.getByRole('menuitem', { name: 'Report' })).not.toBeVisible();
	});

	test('should be able to report a message', async ({ page }) => {
		await page.goto('/home');
		await poHomeChannel.sidenav.openChat(targetChannel);
		const testMessage = faker.lorem.sentence();
		await poHomeChannel.content.sendMessage(testMessage);

		// Admin reports the message
		const adminHomeChannel = new HomeChannel(adminPage);
		await adminPage.goto('/home');
		await adminHomeChannel.sidenav.openChat(targetChannel);

		await adminHomeChannel.content.openLastMessageMenu();
		await adminPage.getByRole('menuitem', { name: 'Report' }).click();

		await expect(adminPage.getByRole('dialog', { name: 'Report this message?' })).toBeVisible();

		// Fill in report description
		const reportDescription = faker.lorem.sentence();
		await reportModal.inputReportDescription.fill(reportDescription);

		await reportModal.btnSubmitReport.click();

		await expect(reportModal.reportSuccessMessage).toBeVisible();
	});

	test('should validate empty report description', async ({ page }) => {
		await page.goto('/home');
		await poHomeChannel.sidenav.openChat(targetChannel);
		const testMessage = faker.lorem.sentence();
		await poHomeChannel.content.sendMessage(testMessage);

		const adminHomeChannel = new HomeChannel(adminPage);
		await adminPage.goto('/home');
		await adminHomeChannel.sidenav.openChat(targetChannel);

		await adminHomeChannel.content.openLastMessageMenu();
		await adminPage.getByRole('menuitem', { name: 'Report' }).click();

		await reportModal.btnSubmitReport.click();

		await expect(reportModal.reportDescriptionError).toBeVisible();
	});

	test('should be able to cancel reporting a message', async ({ page }) => {
		await page.goto('/home');
		await poHomeChannel.sidenav.openChat(targetChannel);
		const testMessage = faker.lorem.sentence();
		await poHomeChannel.content.sendMessage(testMessage);

		const adminHomeChannel = new HomeChannel(adminPage);
		await adminPage.goto('/home');
		await adminHomeChannel.sidenav.openChat(targetChannel);

		await adminHomeChannel.content.openLastMessageMenu();
		await adminPage.getByRole('menuitem', { name: 'Report' }).click();

		await expect(adminPage.getByRole('dialog', { name: 'Report this message?' })).toBeVisible();

		await reportModal.btnCancelReport.click();

		await expect(adminPage.getByRole('dialog', { name: 'Report this message?' })).not.toBeVisible();
	});

	test('should show reported message in moderation console', async ({ page }) => {
		await page.goto('/home');
		await poHomeChannel.sidenav.openChat(targetChannel);
		const testMessage = faker.lorem.sentence();
		await poHomeChannel.content.sendMessage(testMessage);

		const adminHomeChannel = new HomeChannel(adminPage);
		await adminPage.goto('/home');
		await adminHomeChannel.sidenav.openChat(targetChannel);

		await adminHomeChannel.content.openLastMessageMenu();
		await adminPage.getByRole('menuitem', { name: 'Report' }).click();

		const reportDescription = faker.lorem.sentence();
		await reportModal.inputReportDescription.fill(reportDescription);

		await reportModal.btnSubmitReport.click();

		await adminPage.goto('/admin/moderation');

		await expect(adminPage.getByText('user1')).toBeVisible();
		await adminPage.getByText('user1').click();

		await expect(adminPage.getByText(testMessage)).toBeVisible();

		await adminPage.getByRole('button', { name: 'Show reports' }).first().click();
		await expect(adminPage.getByText(reportDescription)).toBeVisible();
	});
});
