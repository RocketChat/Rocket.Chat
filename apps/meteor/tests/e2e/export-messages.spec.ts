import { Users } from './fixtures/userStates';
import { HomeChannel, Utils } from './page-objects';
import { createTargetChannel } from './utils';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('export-messages', () => {
	let poHomeChannel: HomeChannel;
	let poUtils: Utils;
	let targetChannel: string;

	test.beforeAll(async ({ api }) => {
		targetChannel = await createTargetChannel(api);
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		poUtils = new Utils(page);

		await page.goto('/home');
	});

	test('should all export methods be available in targetChannel', async () => {
		await poHomeChannel.sidenav.openChat(targetChannel);
		await poHomeChannel.tabs.kebab.click({ force: true });
		await poHomeChannel.tabs.btnExportMessages.click();
		await poHomeChannel.tabs.exportMessages.method.click();

		await expect(poHomeChannel.tabs.exportMessages.getMethodOptionByName('Send email')).toBeVisible();
		await expect(poHomeChannel.tabs.exportMessages.getMethodOptionByName('Send file via email')).toBeVisible();
		await expect(poHomeChannel.tabs.exportMessages.getMethodOptionByName('Download file')).toBeVisible();
	});

	test('should display export output format correctly depending on the selected method', async () => {
		await poHomeChannel.sidenav.openChat(targetChannel);
		await poHomeChannel.tabs.kebab.click({ force: true });
		await poHomeChannel.tabs.btnExportMessages.click();

		// TODO: Fix the base component to have a disabled statement and not only a class attribute
		// Here we are checking for a button because the internal select element is not accessible
		// and the higher component that is a button doesn't appear as disabled.
		await expect(poHomeChannel.tabs.exportMessages.outputFormat).toContainClass('disabled');

		await poHomeChannel.tabs.exportMessages.setMethod('Send file via email');

		await poHomeChannel.tabs.exportMessages.outputFormat.click();
		await expect(poHomeChannel.tabs.exportMessages.getOutputFormatOptionByName('html')).toBeVisible();
		await expect(poHomeChannel.tabs.exportMessages.getOutputFormatOptionByName('json')).toBeVisible();
		await expect(poHomeChannel.tabs.exportMessages.getOutputFormatOptionByName('pdf')).not.toBeVisible();
		await poHomeChannel.tabs.exportMessages.getOutputFormatOptionByName('html').click();

		await poHomeChannel.tabs.exportMessages.setMethod('Download file');

		await poHomeChannel.tabs.exportMessages.outputFormat.click();
		await expect(poHomeChannel.tabs.exportMessages.getOutputFormatOptionByName('html')).not.toBeVisible();
		await expect(poHomeChannel.tabs.exportMessages.getOutputFormatOptionByName('json')).toBeVisible();
		await expect(poHomeChannel.tabs.exportMessages.getOutputFormatOptionByName('pdf')).toBeVisible();
	});

	test('should display an error when trying to send email without filling to users or to additional emails', async () => {
		await poHomeChannel.sidenav.openChat(targetChannel);
		await poHomeChannel.content.sendMessage('hello world');
		await poHomeChannel.tabs.kebab.click({ force: true });
		await poHomeChannel.tabs.btnExportMessages.click();

		await expect(poHomeChannel.btnContextualbarClose).toBeVisible();

		await poHomeChannel.content.getMessageByText('hello world').click();
		await poHomeChannel.tabs.exportMessages.btnSend.click();

		await expect(
			poUtils.getAlertByText('You must select one or more users or provide one or more email addresses, separated by commas'),
		).toBeVisible();
	});

	test('should display an error when trying to send email without selecting any message', async () => {
		await poHomeChannel.sidenav.openChat(targetChannel);
		await poHomeChannel.tabs.kebab.click({ force: true });
		await poHomeChannel.tabs.btnExportMessages.click();

		await poHomeChannel.tabs.exportMessages.textboxAdditionalEmails.fill('mail@mail.com');
		await poHomeChannel.tabs.exportMessages.btnSend.click();

		await expect(poUtils.getAlertByText(`You haven't selected any messages`)).toBeVisible();
	});

	test('should be able to send messages after closing export messages', async () => {
		await poHomeChannel.sidenav.openChat(targetChannel);
		await poHomeChannel.tabs.kebab.click({ force: true });
		await poHomeChannel.tabs.btnExportMessages.click();

		await poHomeChannel.content.getMessageByText('hello world').click();
		await poHomeChannel.btnContextualbarClose.click();
		await poHomeChannel.content.sendMessage('hello export');

		await expect(poHomeChannel.content.getMessageByText('hello export')).toBeVisible();
	});
});
