import { faker } from '@faker-js/faker';
import type { Page } from '@playwright/test';

import { Users } from './fixtures/userStates';
import { AdminModeration, HomeChannel } from './page-objects';
import { ReportMessageModal } from './page-objects/fragments';
import { createTargetChannelAndReturnFullRoom, deleteChannel } from './utils';
import { sendMessageFromUser } from './utils/sendMessage';
import { test, expect } from './utils/test';

test.use({ storageState: Users.user1.state });

test.describe.serial('report message', () => {
	let poHomeChannel: HomeChannel;
	let adminHomeChannel: HomeChannel;
	let targetChannel: string;
	let targetChannelId: string;
	let adminPage: Page;
	let reportModal: ReportMessageModal;

	test.beforeAll(async ({ api, browser }) => {
		const { channel } = await createTargetChannelAndReturnFullRoom(api, { members: ['user1', 'admin'] });
		targetChannel = channel.name as string;
		targetChannelId = channel._id;
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
		adminHomeChannel = new HomeChannel(adminPage);
	});

	test('should show report message option in message menu for other users messages', async ({ request }) => {
		await test.step('send message as user1', async () => {
			await sendMessageFromUser(request, Users.user1, targetChannelId, faker.lorem.sentence());
			await adminHomeChannel.gotoChannel(targetChannel);
		});

		await test.step('verify report option is visible for the other user', async () => {
			await adminHomeChannel.content.openLastMessageMenu();
			await expect(adminPage.getByRole('menuitem', { name: 'Report' })).toBeVisible();
		});
	});

	test('should not show report message option in message menu for own messages', async ({ page, request }) => {
		await test.step('send message as user1', async () => {
			await sendMessageFromUser(request, Users.user1, targetChannelId, faker.lorem.sentence());
			await poHomeChannel.gotoChannel(targetChannel);
		});

		await test.step('verify report option is not visible for own message', async () => {
			await poHomeChannel.content.openLastMessageMenu();
			await expect(page.getByRole('menuitem', { name: 'Report' })).not.toBeVisible();
		});
	});

	test('should validate empty report description', async ({ request }) => {
		await test.step('send message as user1', async () => {
			await sendMessageFromUser(request, Users.user1, targetChannelId, faker.lorem.sentence());
			await adminHomeChannel.gotoChannel(targetChannel);
		});

		await test.step('try to submit empty report', async () => {
			await adminHomeChannel.content.openLastMessageMenu();
			await adminPage.getByRole('menuitem', { name: 'Report' }).click();
			await reportModal.submitReport();
		});
	});

	test('should be able to cancel reporting a message', async ({ request }) => {
		await test.step('send message as user1', async () => {
			await sendMessageFromUser(request, Users.user1, targetChannelId, faker.lorem.sentence());
			await adminHomeChannel.gotoChannel(targetChannel);
		});

		await test.step('open and cancel report modal', async () => {
			await adminHomeChannel.content.openLastMessageMenu();
			await adminPage.getByRole('menuitem', { name: 'Report' }).click();
			await reportModal.cancelReport();
		});
	});

	test('should successfully report a message and verify its appearance in moderation console', async ({ request }) => {
		let testMessage: string;
		let reportDescription: string;

		await test.step('send message as user1', async () => {
			testMessage = faker.lorem.sentence();
			await sendMessageFromUser(request, Users.user1, targetChannelId, testMessage);
			await adminHomeChannel.gotoChannel(targetChannel);
		});

		await test.step('report message as the other user', async () => {
			reportDescription = faker.lorem.sentence();

			await adminHomeChannel.content.openLastMessageMenu();
			await adminPage.getByRole('menuitem', { name: 'Report' }).click();
			await reportModal.submitReport(reportDescription);
		});

		await test.step('verify report in moderation console', async () => {
			await new AdminModeration(adminPage).gotoMessages();

			await expect(adminPage.getByRole('tab', { name: 'Reported messages' })).toBeVisible();
			const reportedUserLink = adminPage.getByRole('table').getByRole('link', { name: 'user1' });
			await expect(reportedUserLink).toBeVisible();
			await reportedUserLink.click();

			await expect(adminPage.getByText(testMessage)).toBeVisible();

			await adminPage.getByRole('button', { name: 'Show reports' }).click();
			await expect(adminPage.getByText(reportDescription)).toBeVisible();
		});
	});
});
