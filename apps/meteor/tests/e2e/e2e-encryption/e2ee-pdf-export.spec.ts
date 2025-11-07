import { faker } from '@faker-js/faker';

import { Users } from '../fixtures/userStates';
import { EncryptedRoomPage } from '../page-objects/encrypted-room';
import { CreateE2EEChannel } from '../page-objects/fragments/e2ee';
import { ExportMessagesTab } from '../page-objects/fragments/export-messages-tab';
import { LoginPage } from '../page-objects/login';
import { deleteRoom } from '../utils/create-target-channel';
import { preserveSettings } from '../utils/preserveSettings';
import { test, expect } from '../utils/test';

const settingsList = [
	'E2E_Enable',
	'E2E_Allow_Unencrypted_Messages',
	'E2E_Enabled_Default_DirectRooms',
	'E2E_Enabled_Default_PrivateRooms',
];

preserveSettings(settingsList);

test.describe('E2EE PDF Export', () => {
	const createdChannels: { name: string; id?: string | null }[] = [];
	let createE2EEChannel: CreateE2EEChannel;

	test.use({ storageState: Users.admin.state });

	test.beforeAll(async ({ api }) => {
		await api.post('/settings/E2E_Enable', { value: true });
		await api.post('/settings/E2E_Allow_Unencrypted_Messages', { value: true });
		await api.post('/settings/E2E_Enabled_Default_DirectRooms', { value: false });
		await api.post('/settings/E2E_Enabled_Default_PrivateRooms', { value: false });
	});

	test.beforeEach(async ({ api, page }) => {
		const loginPage = new LoginPage(page);

		await api.post('/method.call/e2e.resetOwnE2EKey', {
			message: JSON.stringify({ msg: 'method', id: '1', method: 'e2e.resetOwnE2EKey', params: [] }),
		});

		await page.goto('/home');
		await loginPage.waitForIt();
		await loginPage.loginByUserState(Users.admin);
		createE2EEChannel = new CreateE2EEChannel(page);
	});

	test.afterAll(async ({ api }) => {
		await Promise.all(createdChannels.map(({ id }) => (id ? deleteRoom(api, id) : Promise.resolve())));
	});

	test('should display only the download file method when exporting messages in an e2ee room', async ({ page }) => {
		const encryptedRoomPage = new EncryptedRoomPage(page);
		const exportMessagesTab = new ExportMessagesTab(page);

		const channelName = faker.string.uuid();

		await createE2EEChannel.createAndStore(channelName, createdChannels);
		await expect(page).toHaveURL(`/group/${channelName}`);
		await expect(encryptedRoomPage.encryptedRoomHeaderIcon).toBeVisible();

		await encryptedRoomPage.showExportMessagesTab();
		await expect(exportMessagesTab.method).toContainClass('disabled'); // FIXME: looks like the component have an a11y issue
		await expect(exportMessagesTab.method).toHaveAccessibleName('Download file');
	});

	test('should allow exporting messages as PDF in an encrypted room', async ({ page }) => {
		const encryptedRoomPage = new EncryptedRoomPage(page);
		const exportMessagesTab = new ExportMessagesTab(page);

		const channelName = faker.string.uuid();

		await createE2EEChannel.createAndStore(channelName, createdChannels);
		await expect(page).toHaveURL(`/group/${channelName}`);
		await expect(encryptedRoomPage.encryptedRoomHeaderIcon).toBeVisible();

		await encryptedRoomPage.sendMessage('This is a message to export as PDF.');
		await encryptedRoomPage.showExportMessagesTab();
		await expect(exportMessagesTab.method).toHaveAccessibleName('Download file');

		// Select Output format as PDF
		await exportMessagesTab.setOutputFormat('PDF');

		// select messages to be exported
		await exportMessagesTab.selectAllMessages();

		// Wait for download event and match format
		const download = await exportMessagesTab.downloadMessages();
		expect(download.suggestedFilename()).toMatch(/\.pdf$/);
	});
});
