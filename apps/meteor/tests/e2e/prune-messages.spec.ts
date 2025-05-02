import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel, setSettingValueById } from './utils';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe('prune-messages', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: string;

	test.beforeAll(async ({ api }) => {
		await Promise.all([
			setSettingValueById(api, 'FileUpload_MediaTypeBlackList', 'image/svg+xml'),
			setSettingValueById(api, 'FileUpload_Storage_Type', 'FileSystem'),
			setSettingValueById(api, 'FileUpload_FileSystemPath', '/tmp/rc-test-ufs-local-0'),
		]);
		targetChannel = await createTargetChannel(api, { members: [Users.admin.data.username] });
	});

	test.afterAll(async ({ api }) => {
		expect((await api.post('/channels.delete', { roomName: targetChannel })).status()).toBe(200);
		await Promise.all([
			setSettingValueById(api, 'FileUpload_MediaTypeBlackList', 'image/svg+xml'),
			setSettingValueById(api, 'FileUpload_Storage_Type', 'GridFS'),
			setSettingValueById(api, 'FileUpload_FileSystemPath', '/tmp/rc-test-ufs-local-0'),
		]);
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		await page.goto('/home');
		await poHomeChannel.sidenav.openChat(targetChannel);
	});

	test('should prune messages (filesOnly)', async ({ page }) => {
		await poHomeChannel.content.sendFileMessage('test-large-image.jpeg');
		await poHomeChannel.content.fileNameInput.fill('test-large-image.jpeg');
		await poHomeChannel.content.descriptionInput.fill('test-large-image_description');
		await poHomeChannel.content.btnModalConfirm.click();

		await expect(poHomeChannel.content.lastUserMessage).toContainText('test-large-image.jpeg');

		await page.getByRole('button', { name: 'Options' }).click();
		await page.getByText('Prune Messages').click();
		await page.locator('span').filter({ hasText: 'Only remove the attached' }).locator('i').click();
		await page.getByRole('button', { name: 'Prune' }).click();
		await page.getByRole('button', { name: 'Yes, prune them!' }).click();
		await expect(page.getByText('2 messages pruned')).toBeVisible();

		await page.reload();

		await page.getByText('File removed by prune').click();

		await expect(page.getByText('test-large-image.jpeg')).not.toBeVisible();
		await expect(page.getByText('File removed by prune')).toBeVisible();
	});
});
