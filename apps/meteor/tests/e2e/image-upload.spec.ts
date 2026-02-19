import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel, getSettingValueById, setSettingValueById } from './utils';
import { test, expect } from './utils/test';

test.use({ storageState: Users.user1.state });

test.describe('image-upload', () => {
	let defaultStripSetting: unknown;
	let defaultRotateSetting: unknown;
	let poHomeChannel: HomeChannel;
	let targetChannel: string;

	test.beforeAll(async ({ api }) => {
		defaultStripSetting = await getSettingValueById(api, 'Message_Attachments_Strip_Exif');
		defaultRotateSetting = await getSettingValueById(api, 'FileUpload_RotateImages');
		targetChannel = await createTargetChannel(api, { members: ['user1'] });
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		await page.goto('/home');
		await poHomeChannel.navbar.openChat(targetChannel);
	});

	test.afterAll(async ({ api }) => {
		await setSettingValueById(api, 'Message_Attachments_Strip_Exif', defaultStripSetting);
		await setSettingValueById(api, 'FileUpload_RotateImages', defaultRotateSetting);
		expect((await api.post('/channels.delete', { roomName: targetChannel })).status()).toBe(200);
	});

	test.describe('strip exif disabled', () => {
		test.beforeAll(async ({ api }) => {
			await setSettingValueById(api, 'Message_Attachments_Strip_Exif', false);
		});

		test('should show error indicator when upload fails', async () => {
			await poHomeChannel.content.sendFileMessage('bad-orientation.jpeg');

			await expect(poHomeChannel.composer.getFileByName('bad-orientation')).toHaveAttribute('readonly');
		});
	});

	test.describe('strip exif enabled', () => {
		test.beforeAll(async ({ api }) => {
			await setSettingValueById(api, 'Message_Attachments_Strip_Exif', true);
			// Image rotation now happens before EXIF stripping, so we need to disable it to properly test it
			await setSettingValueById(api, 'FileUpload_RotateImages', false);
		});

		test('should succeed upload of bad-orientation.jpeg', async () => {
			const imgName = 'bad-orientation.jpeg';
			await poHomeChannel.content.sendFileMessage(imgName);
			await poHomeChannel.composer.btnSend.click();
			await expect(poHomeChannel.content.lastUserMessage).toContainText(imgName);
		});
	});
});
