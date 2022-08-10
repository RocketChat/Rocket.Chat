import { expect, test } from './utils/test';
import { HomeChannel } from './page-objects';
import { createTargetChannel } from './utils';

test.use({ storageState: 'user1-session.json' });

test.describe.serial('file-upload', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: string;

	test.beforeAll(async ({ api }) => {
		targetChannel = await createTargetChannel(api);
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
		await poHomeChannel.sidenav.openChat(targetChannel);
	});

	test('expect successfully cancel upload', async () => {
		await poHomeChannel.content.dragAndDropFile();
		await poHomeChannel.content.btnModalCancel.click();
		await expect(poHomeChannel.content.modalFilePreview).not.toBeVisible();
	});

	test('expect send file not show modal', async () => {
		await poHomeChannel.content.dragAndDropFile();
		await poHomeChannel.content.btnModalConfirm.click();
		await expect(poHomeChannel.content.modalFilePreview).not.toBeVisible();
	});

	test('expect send file with name/description updated', async () => {
		await poHomeChannel.content.dragAndDropFile();
		await poHomeChannel.content.descriptionInput.fill('any_description');
		await poHomeChannel.content.fileNameInput.fill('any_file1.txt');
		await poHomeChannel.content.btnModalConfirm.click();

		await expect(poHomeChannel.content.getFileDescription).toHaveText('any_description');
		await expect(poHomeChannel.content.lastMessageFileName).toContainText('any_file1.txt');
	});
});
