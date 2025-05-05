import type { Page } from '@playwright/test';

import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel, deleteChannel, setSettingValueById } from './utils';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe('prune-messages', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: string;

	test.beforeAll(async ({ api }) => {
		targetChannel = await createTargetChannel(api, { members: [Users.admin.data.username] });
	});

	test.afterAll(async ({ api }) => {
		await deleteChannel(api, targetChannel);
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		await page.goto('/home');
		await poHomeChannel.sidenav.openChat(targetChannel);
	});

	test.afterEach(async ({ api }) => {
		await Promise.all([
			setSettingValueById(api, 'FileUpload_Storage_Type', 'GridFS'),
			setSettingValueById(api, 'FileUpload_FileSystemPath', ''),
		]);
	});

	test('should prune messages (filesOnly)', async ({ page, api }) => {
		await setSettingValueById(api, 'FileUpload_Storage_Type', 'FileSystem');
		await setSettingValueById(api, 'FileUpload_FileSystemPath', `/tmp/rc-test-ufs-local-0`);

		await sendFileMessage(poHomeChannel);

		await expect(poHomeChannel.content.lastUserMessage).toContainText('test-large-image.jpeg');

		await pruneMessages(page, { filesOnly: true });
		await expect(page.getByText('1 message pruned')).toBeVisible();

		await page.reload();

		await expect(poHomeChannel.content.lastUserMessage).toContainText('File removed by prune');
	});

	test('should prune messages (filesOnly) - ENOENT', async ({ page, api }) => {
		await test.step('attempt 1', async () => {
			await setSettingValueById(api, 'FileUpload_Storage_Type', 'FileSystem');
			await setSettingValueById(api, 'FileUpload_FileSystemPath', `/tmp/rc-test-ufs-local-1`);

			await sendFileMessage(poHomeChannel);
			await expect(poHomeChannel.content.lastUserMessage).toContainText('test-large-image.jpeg');

			await setSettingValueById(api, 'FileUpload_FileSystemPath', '/tmp/rc-test-ufs-local-2');

			await pruneMessages(page, { filesOnly: true });

			await expect(page.getByText('No messages found to prune')).toBeVisible();

			await page.reload();

			await expect(poHomeChannel.content.lastUserMessage).not.toContainText('File removed by prune');
		});

		await test.step('attempt 2', async () => {
			await setSettingValueById(api, 'FileUpload_Storage_Type', 'FileSystem');
			await setSettingValueById(api, 'FileUpload_FileSystemPath', `/tmp/rc-test-ufs-local-1`);

			await expect(poHomeChannel.content.lastUserMessage).toContainText('test-large-image.jpeg');

			await pruneMessages(page, { filesOnly: true });

			await expect(page.getByText('1 message pruned')).toBeVisible();

			await page.reload();

			await expect(poHomeChannel.content.lastUserMessage).toContainText('File removed by prune');
		});
	});
});

async function pruneMessages(page: Page, { filesOnly = false } = {}) {
	if (!page.url().endsWith('/clean-history')) {
		await page.getByRole('button', { name: 'Options' }).click();
		await page.getByRole('menuitem', { name: 'Prune Messages' }).click();
	}
	if (filesOnly) {
		await page.locator('span').filter({ hasText: 'Only remove the attached' }).locator('i').click();
	}
	await page.getByRole('button', { name: 'Prune' }).click();
	return page.getByRole('button', { name: 'Yes, prune them!' }).click();
}

async function sendFileMessage(poHomeChannel: HomeChannel, fileName = 'test-large-image.jpeg') {
	await poHomeChannel.content.sendFileMessage(fileName);
	await poHomeChannel.content.fileNameInput.fill(fileName);
	await poHomeChannel.content.descriptionInput.fill(`${fileName} description`);
	return poHomeChannel.content.btnModalConfirm.click();
}
