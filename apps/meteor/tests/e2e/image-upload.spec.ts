import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel, getSettingValueById, setSettingValueById } from './utils';
import { test, expect } from './utils/test';

test.use({ storageState: Users.user1.state });

test.describe('image-upload', () => {
	let settingDefaultValue: unknown;
	let poHomeChannel: HomeChannel;
	let targetChannel: string;

	test.beforeAll(async ({ api }) => {
		settingDefaultValue = await getSettingValueById(api, 'Message_Attachments_Strip_Exif');
		targetChannel = await createTargetChannel(api, { members: ['user1'] });
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		await page.goto('/home');
		await poHomeChannel.sidenav.openChat(targetChannel);
	});

	test.afterAll(async ({ api }) => {
		await setSettingValueById(api, 'Message_Attachments_Strip_Exif', settingDefaultValue);
		expect((await api.post('/channels.delete', { roomName: targetChannel })).status()).toBe(200);
	});

	test.describe('strip exif disabled', () => {
		test.beforeAll(async ({ api }) => {
			await setSettingValueById(api, 'Message_Attachments_Strip_Exif', false);
		});

		test('should show error indicator when upload fails', async () => {
			await poHomeChannel.content.sendFileMessage('bad-orientation.jpeg');
			await poHomeChannel.content.fileNameInput.fill('bad-orientation.jpeg');
			await poHomeChannel.content.descriptionInput.fill('bad-orientation_description');
			await poHomeChannel.content.btnModalConfirm.click();

			await expect(poHomeChannel.statusUploadIndicator).toContainText('Error:');
		});
	});

	test.describe('strip exif enabled', () => {
		test.beforeAll(async ({ api }) => {
			await setSettingValueById(api, 'Message_Attachments_Strip_Exif', true);
		});

		test('should succeed upload of bad-orientation.jpeg', async () => {
			await poHomeChannel.content.sendFileMessage('bad-orientation.jpeg');
			await poHomeChannel.content.fileNameInput.fill('bad-orientation.jpeg');
			await poHomeChannel.content.descriptionInput.fill('bad-orientation_description');
			await poHomeChannel.content.btnModalConfirm.click();

			await expect(poHomeChannel.content.getFileDescription).toHaveText('bad-orientation_description');
		});
	});
});
