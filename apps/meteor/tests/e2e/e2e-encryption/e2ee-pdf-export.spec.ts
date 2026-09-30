import type { Page } from '@playwright/test';

import { resetOwnE2EKey } from './resetOwnE2EKey';
import { ADMIN_CREDENTIALS } from '../config/constants';
import { Users } from '../fixtures/userStates';
import { HomeChannel } from '../page-objects';
import { EncryptedRoomPage } from '../page-objects/encrypted-room';
import { ExportMessagesFlexTab } from '../page-objects/fragments/flextabs';
import { LoginPage } from '../page-objects/login';
import { createTargetGroupAndReturnFullRoom, deletePrivateRoomsByName } from '../utils';
import { preserveSettings } from '../utils/preserveSettings';
import { test, expect } from '../utils/test';

const settingsList = [
	'E2E_Enable',
	'E2E_Allow_Unencrypted_Messages',
	'E2E_Enabled_Default_DirectRooms',
	'E2E_Enabled_Default_PrivateRooms',
];

preserveSettings(settingsList);

const waitForRoomKeyReady = async (page: Page, rid: string) => {
	await expect
		.poll(
			() =>
				page.evaluate(async (rid) => {
					// eslint-disable-next-line import-x/no-absolute-path
					const { e2e } = require('/client/lib/e2ee/rocketchat.e2e.ts') as typeof import('../../../client/lib/e2ee/rocketchat.e2e');
					const room = await e2e.getInstanceByRoomId(rid);
					return room?.getState();
				}, rid),
			{ message: 'expect room encryption key to be ready before sending messages' },
		)
		.toBe('READY');
};

test.describe('E2EE PDF Export', () => {
	const createdChannels: string[] = [];

	test.use({ storageState: Users.admin.state });

	test.beforeAll(async ({ api }) => {
		await api.post('/settings/E2E_Enable', { value: true });
		await api.post('/settings/E2E_Allow_Unencrypted_Messages', { value: true });
		await api.post('/settings/E2E_Enabled_Default_DirectRooms', { value: false });
		await api.post('/settings/E2E_Enabled_Default_PrivateRooms', { value: false });
		// Note: Using admin user, so no need for userE2EE cleanup
	});

	test.beforeEach(async ({ page }) => {
		const loginPage = new LoginPage(page);

		await expect(await resetOwnE2EKey(ADMIN_CREDENTIALS)).toBeOK();

		await loginPage.goto();
		await loginPage.loginByUserState(Users.admin);
	});

	test.afterAll(async () => {
		await deletePrivateRoomsByName(ADMIN_CREDENTIALS, createdChannels);
	});

	test('should display only the download file method when exporting messages in an e2ee room', async ({ api, page }) => {
		const encryptedRoomPage = new EncryptedRoomPage(page);
		const exportMessagesTab = new ExportMessagesFlexTab(page);
		const poHomeChannel = new HomeChannel(page);

		const { group } = await createTargetGroupAndReturnFullRoom(api, { extraData: { broadcast: false, encrypted: true } });
		createdChannels.push(group.name as string);

		await poHomeChannel.gotoGroup(group.name as string);
		await expect(encryptedRoomPage.encryptedRoomHeaderIcon).toBeVisible();
		await waitForRoomKeyReady(page, group._id);

		await encryptedRoomPage.showExportMessagesTab();
		await expect(exportMessagesTab.method).toContainClass('disabled'); // FIXME: looks like the component have an a11y issue
		await expect(exportMessagesTab.method).toHaveAccessibleName('Download file Method');
	});

	test('should allow exporting messages as PDF in an encrypted room', async ({ api, page }) => {
		const encryptedRoomPage = new EncryptedRoomPage(page);
		const exportMessagesTab = new ExportMessagesFlexTab(page);
		const poHomeChannel = new HomeChannel(page);

		const { group } = await createTargetGroupAndReturnFullRoom(api, { extraData: { broadcast: false, encrypted: true } });
		createdChannels.push(group.name as string);

		await poHomeChannel.gotoGroup(group.name as string);
		await expect(encryptedRoomPage.encryptedRoomHeaderIcon).toBeVisible();
		await waitForRoomKeyReady(page, group._id);

		await encryptedRoomPage.sendMessage('This is a message to export as PDF.');
		await encryptedRoomPage.showExportMessagesTab();
		await expect(exportMessagesTab.method).toHaveAccessibleName('Download file Method');

		// Select Output format as PDF
		await exportMessagesTab.setOutputFormat('PDF');

		// select messages to be exported
		await exportMessagesTab.selectAllMessages();

		// Wait for download event and match format
		const download = await exportMessagesTab.downloadMessages();
		expect(download.suggestedFilename()).toMatch(/\.pdf$/);
	});
});
