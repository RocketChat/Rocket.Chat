import { faker } from '@faker-js/faker';

import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { ExportMessagesTab } from './page-objects/fragments';
import { createTargetChannel, deleteChannel } from './utils';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

const uniqueMessage = (): string => `msg-${faker.string.uuid()}`;

test.describe('export-messages', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: string;

	test.beforeAll(async ({ api }) => {
		targetChannel = await createTargetChannel(api);
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
	});

	test.afterAll(async ({ api }) => {
		await Promise.all([
			api.post('/users.setPreferences', { userId: 'rocketchat.internal.admin.test', data: { hideFlexTab: false } }),
			deleteChannel(api, targetChannel),
		]);
	});

	test('should all export methods be available in targetChannel', async ({ page }) => {
		const exportMessagesTab = new ExportMessagesTab(page);

		await poHomeChannel.navbar.openChat(targetChannel);
		await poHomeChannel.tabs.kebab.click({ force: true });
		await poHomeChannel.tabs.btnExportMessages.click();

		await exportMessagesTab.exposeMethods();
		await expect(exportMessagesTab.getMethodOptionByName('Send email')).toBeVisible();
		await expect(exportMessagesTab.getMethodOptionByName('Send file via email')).toBeVisible();
		await expect(exportMessagesTab.getMethodOptionByName('Download file')).toBeVisible();
	});

	test('should display export output format correctly depending on the selected method', async ({ page }) => {
		const exportMessagesTab = new ExportMessagesTab(page);

		await poHomeChannel.navbar.openChat(targetChannel);
		await poHomeChannel.tabs.kebab.click({ force: true });
		await poHomeChannel.tabs.btnExportMessages.click();

		// TODO: Fix the base component to have a disabled statement and not only a class attribute
		// Here we are checking for a button because the internal select element is not accessible
		// and the higher component that is a button doesn't appear as disabled.
		await expect(exportMessagesTab.outputFormat).toContainClass('disabled');

		await exportMessagesTab.setMethod('Send file via email');

		await exportMessagesTab.exposeOutputFormats();
		await expect(exportMessagesTab.getOutputFormatOptionByName('html')).toBeVisible();
		await expect(exportMessagesTab.getOutputFormatOptionByName('json')).toBeVisible();
		await expect(exportMessagesTab.getOutputFormatOptionByName('pdf')).not.toBeVisible();

		await exportMessagesTab.setOutputFormat('html');

		await exportMessagesTab.setMethod('Download file');

		await exportMessagesTab.exposeOutputFormats();
		await expect(exportMessagesTab.getOutputFormatOptionByName('html')).not.toBeVisible();
		await expect(exportMessagesTab.getOutputFormatOptionByName('json')).toBeVisible();
		await expect(exportMessagesTab.getOutputFormatOptionByName('pdf')).toBeVisible();
	});

	test('should display an error when trying to send email without filling to users or to additional emails', async ({ page }) => {
		const exportMessagesTab = new ExportMessagesTab(page);
		const testMessage = uniqueMessage();

		await poHomeChannel.navbar.openChat(targetChannel);
		await poHomeChannel.content.sendMessage(testMessage);
		await poHomeChannel.tabs.kebab.click({ force: true });
		await poHomeChannel.tabs.btnExportMessages.click();

		await expect(poHomeChannel.btnContextualbarClose).toBeVisible();

		await poHomeChannel.content.getMessageByText(testMessage).click();
		await exportMessagesTab.send();

		await expect(
			page.locator('[role="alert"]', {
				hasText: 'You must select one or more users or provide one or more email addresses, separated by commas',
			}),
		).toBeVisible();
	});

	test('should display an error when trying to send email without selecting any message', async ({ page }) => {
		const exportMessagesTab = new ExportMessagesTab(page);

		await poHomeChannel.navbar.openChat(targetChannel);
		await poHomeChannel.tabs.kebab.click({ force: true });
		await poHomeChannel.tabs.btnExportMessages.click();

		await exportMessagesTab.setAdditionalEmail('mail@mail.com');
		await exportMessagesTab.send();

		await expect(
			page.locator('[role="alert"]', {
				hasText: `You haven't selected any messages`,
			}),
		).toBeVisible();
	});

	test('should be able to send messages after closing export messages', async () => {
		const message1 = uniqueMessage();
		const message2 = uniqueMessage();

		await poHomeChannel.navbar.openChat(targetChannel);
		await poHomeChannel.content.sendMessage(message1);
		await poHomeChannel.tabs.kebab.click({ force: true });
		await poHomeChannel.tabs.btnExportMessages.click();

		await poHomeChannel.content.getMessageByText(message1).click();
		await poHomeChannel.btnContextualbarClose.click();
		await poHomeChannel.content.sendMessage(message2);

		await expect(poHomeChannel.content.getMessageByText(message2)).toBeVisible();
	});

	test('should be able to select a single message to export', async ({ page }) => {
		const exportMessagesTab = new ExportMessagesTab(page);
		const message1 = uniqueMessage();
		const message2 = uniqueMessage();

		await poHomeChannel.navbar.openChat(targetChannel);
		await poHomeChannel.content.sendMessage(message1);
		await poHomeChannel.content.sendMessage(message2);

		await poHomeChannel.tabs.kebab.click({ force: true });
		await poHomeChannel.tabs.btnExportMessages.click();
		await exportMessagesTab.waitForDisplay();

		await poHomeChannel.content.getMessageByText(message1).click();

		await expect(exportMessagesTab.getMessageCheckbox(message1)).toBeChecked();
		await expect(exportMessagesTab.getMessageCheckbox(message2)).not.toBeChecked();
		await expect(exportMessagesTab.clearSelectionButton).toBeEnabled();

		await expect(exportMessagesTab.sendButton).toBeEnabled();
	});

	test('should be able to select a single message to export with hide contextual bar preference enabled', async ({ page, api }) => {
		await api.post('/users.setPreferences', {
			userId: 'rocketchat.internal.admin.test',
			data: { hideFlexTab: true },
		});
		const message1 = uniqueMessage();
		const message2 = uniqueMessage();

		const exportMessagesTab = new ExportMessagesTab(page);

		await poHomeChannel.navbar.openChat(targetChannel);
		await poHomeChannel.content.sendMessage(message1);
		await poHomeChannel.content.sendMessage(message2);

		await poHomeChannel.tabs.kebab.click({ force: true });
		await poHomeChannel.tabs.btnExportMessages.click();

		await exportMessagesTab.waitForDisplay();
		await poHomeChannel.content.getMessageByText(message1).click();

		await expect(exportMessagesTab.getMessageCheckbox(message1)).toBeChecked();
		await expect(exportMessagesTab.clearSelectionButton).toBeEnabled();

		await expect(exportMessagesTab.sendButton).toBeEnabled();
	});
});
