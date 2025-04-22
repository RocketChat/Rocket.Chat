import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel, setSettingValueById } from './utils';
import { test, expect } from './utils/test';

test.use({ storageState: Users.user1.state });

test.describe('image-upload', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: string;

	test.beforeAll(async ({ api }) => {
		await setSettingValueById(api, 'Message_Attachments_Strip_Exif', false);
		targetChannel = await createTargetChannel(api, { members: ['user1'] });
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		await page.goto('/home');
		await poHomeChannel.sidenav.openChat(targetChannel);
	});

	test.afterAll(async ({ api }) => {
		await setSettingValueById(api, 'Message_Attachments_Strip_Exif', true);
		expect((await api.post('/channels.delete', { roomName: targetChannel })).status()).toBe(200);
	});

	test('shows error indicator when upload fails', async ({ page }) => {
		await poHomeChannel.content.sendFileMessage('bad-orientation.jpeg');
		await poHomeChannel.content.fileNameInput.fill('bad-orientation.jpeg');
		await poHomeChannel.content.descriptionInput.fill('bad-orientation_description');
		await poHomeChannel.content.btnModalConfirm.click();

		await expect(page.getByText('bad-orientation.jpeg')).toContainText('Error:');
	});
});
