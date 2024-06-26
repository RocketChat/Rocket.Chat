import { faker } from '@faker-js/faker';

import { Users } from './fixtures/userStates';
import { Moderation, HomeChannel } from './page-objects';
import { createTargetChannel, deleteChannel } from './utils';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('moderation-console', () => {
	let poModeration: Moderation;
	let poHomeChannel: HomeChannel;
	let targetChannel: string;
	const singleMessage = faker.lorem.text();

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		poModeration = new Moderation(page);

		await page.goto('/home');
	});

	test.beforeAll(async ({ api }) => {
		targetChannel = await createTargetChannel(api);
	});

	test.beforeAll(async ({ browser }) => {
		const user1Page = await browser.newPage({ storageState: Users.user1.state });
		const user1Channel = new HomeChannel(user1Page);
		await user1Page.goto(`/channel/${targetChannel}`);
		await user1Channel.waitForChannel();
		await user1Channel.content.sendMessage(singleMessage);
		await expect(user1Channel.content.lastUserMessage).toContainText(singleMessage);

		await user1Page.close();
	});

	test.afterAll(async ({ api }) => {
		await deleteChannel(api, targetChannel);
	});

	// test('should admin be able to see the reported messages', async ({ page }) => {
	// 	await poHomeChannel.sidenav.openChat(targetChannel);
	// 	await poHomeChannel.content.openLastMessageMenu();
	// 	await poModeration.reportMsgButton.click();
	// 	await poModeration.reportMessageReasonText.fill('Reason to report');
	// 	await poModeration.reportMessageReasonSubmit.click();

	// 	await page.goto('/admin/moderation/messages');
	// 	await poModeration.findRowByName(targetChannel).click();
	// 	await expect(poModeration.findLastReportedMessage(singleMessage)).toBeVisible();
	// });

	test.describe('reported messages', () => {
		test.beforeEach(async () => {
			await poHomeChannel.sidenav.openChat(targetChannel);
			await poHomeChannel.content.openLastMessageMenu();
			await poModeration.reportMsgButton.click();
			await poModeration.reportMessageReasonText.fill('Reason to report');
			await poModeration.reportMessageReasonSubmit.click();
		});

		test('should admin be able to see the reported messages', async ({ page }) => {
			await page.goto('/admin/moderation/messages');
			await poModeration.findRowByName(targetChannel).click();
			await expect(poModeration.findLastReportedMessage(singleMessage)).toBeVisible();
		});

		test('should admin be able to dismiss a report from a user', async ({ page }) => {
			await page.goto('/admin/moderation/messages');
			await poModeration.findRowByName(targetChannel).click();
			await poModeration.findReportedMessage(singleMessage).hover();
			await poModeration.findReportedMessage(singleMessage).locator(poModeration.dismissReportsButton).click();
		});
	});
});
