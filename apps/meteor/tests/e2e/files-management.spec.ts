import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel } from './utils';
import { expect, test } from './utils/test';

test.use({ storageState: Users.user1.state });

const TEST_FILE_TXT = 'any_file.txt';

test.describe.serial('files-management', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: string;

	test.beforeAll(async ({ api }) => {
		targetChannel = await createTargetChannel(api, { members: ['user1'] });
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
		await poHomeChannel.navbar.openChat(targetChannel);
	});

	test.afterAll(async ({ api }) => {
		expect((await api.post('/channels.delete', { roomName: targetChannel })).status()).toBe(200);
	});

	test('should send a file and manage it in the list', async () => {
		await poHomeChannel.content.dragAndDropTxtFile();
		await poHomeChannel.content.btnModalConfirm.click();
		await expect(poHomeChannel.content.lastMessageFileName).toHaveText(TEST_FILE_TXT);

		await poHomeChannel.roomToolbar.openMoreOptions();
		await poHomeChannel.roomToolbar.menuItemFiles.click();
		await expect(poHomeChannel.tabs.files.getFileByName(TEST_FILE_TXT)).toBeVisible();

		await test.step('should open download dialog when clicking on the file in the files tab', async () => {
			const [download] = await Promise.all([
				poHomeChannel.page.waitForEvent('download'),
				poHomeChannel.tabs.files.getFileByName(TEST_FILE_TXT).click(),
			]);

			expect(download).toBeDefined();
			expect(download.suggestedFilename()).toBe(TEST_FILE_TXT);
		});

		await test.step('should delete the file from the list', async () => {
			await poHomeChannel.tabs.files.deleteFile(TEST_FILE_TXT);

			await expect(poHomeChannel.tabs.files.getFileByName(TEST_FILE_TXT)).toHaveCount(0);
			await expect(poHomeChannel.content.lastUserMessage).not.toBeVisible();
		});
	});
});
