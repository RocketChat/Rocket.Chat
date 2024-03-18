import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel } from './utils';
import { expect, test } from './utils/test';

test.use({ storageState: Users.user1.state });

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
		await poHomeChannel.content.dragAndDropTxtFile();
		await poHomeChannel.content.btnModalCancel.click();
		await expect(poHomeChannel.content.modalFilePreview).not.toBeVisible();
	});

	test('expect send file not show modal', async () => {
		await poHomeChannel.content.dragAndDropTxtFile();
		await poHomeChannel.content.btnModalConfirm.click();
		await expect(poHomeChannel.content.modalFilePreview).not.toBeVisible();
	});

	test('expect send file with name/description updated', async () => {
		await poHomeChannel.content.dragAndDropTxtFile();
		await poHomeChannel.content.descriptionInput.fill('any_description');
		await poHomeChannel.content.fileNameInput.fill('any_file1.txt');
		await poHomeChannel.content.btnModalConfirm.click();

		await expect(poHomeChannel.content.getFileDescription).toHaveText('any_description');
		await expect(poHomeChannel.content.lastMessageFileName).toContainText('any_file1.txt');
	});

	test('expect send lst file succesfully', async () => {
		await poHomeChannel.content.dragAndDropLstFile();
		await poHomeChannel.content.descriptionInput.fill('lst_description');
		await poHomeChannel.content.btnModalConfirm.click();

		await expect(poHomeChannel.content.getFileDescription).toHaveText('lst_description');
		await expect(poHomeChannel.content.lastMessageFileName).toContainText('lst-test.lst');
	});
});
