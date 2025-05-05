import type { Page } from '@playwright/test';

import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel, setSettingValueById } from './utils';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe('prune-messages', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: string;

	test.beforeAll('create target channel', async ({ api }) => {
		targetChannel = await createTargetChannel(api, { members: [Users.admin.data.username] });
	});

	test.afterAll('delete target channel', async ({ api }) => {
		expect((await api.post('/channels.delete', { roomName: targetChannel })).status()).toBe(200);
	});

	test.beforeEach('open chat', async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		await page.goto('/home');
		await poHomeChannel.sidenav.openChat(targetChannel);
	});

	test.describe('with attached files in FileSystem (filesOnly)', () => {
		test.beforeAll('set storage type to FileSystem', async ({ api }) => {
			await setSettingValueById(api, 'FileUpload_Storage_Type', 'FileSystem');
		});

		test.afterAll('reset storage type to GridFS', async ({ api }) => {
			await setSettingValueById(api, 'FileUpload_Storage_Type', 'GridFS');
		});

		test('should prune with stable path', async ({ page, api }) => {
			await setSettingValueById(api, 'FileUpload_FileSystemPath', `/tmp/rc-test-ufs-local-0`);

			await sendFileMessage(poHomeChannel, 'test-large-image.jpeg');

			await expect(poHomeChannel.content.lastUserMessage).toContainText('test-large-image.jpeg');

			await pruneMessages(page, { filesOnly: true });
			await expect(page.getByText('1 message pruned')).toBeVisible();

			await page.reload();

			await expect(poHomeChannel.content.lastUserMessage).toContainText('File removed by prune');
		});

		test('should prune after changing path', async ({ page, api }) => {
			await setSettingValueById(api, 'FileUpload_FileSystemPath', `/tmp/rc-test-ufs-local-1`);

			await sendFileMessage(poHomeChannel, 'test-large-image.jpeg');

			await expect(poHomeChannel.content.lastUserMessage).toContainText('test-large-image.jpeg');

			await test.step('attempt to prune with new path', async () => {
				await setSettingValueById(api, 'FileUpload_FileSystemPath', '/tmp/rc-test-ufs-local-2');
				await pruneMessages(page, { filesOnly: true });
				await expect(page.getByText('No messages found to prune')).toBeVisible();
			});

			await test.step('attempt to download with new path', async () => {
				await page.reload();
				await expect(poHomeChannel.content.lastUserMessage).not.toContainText('File removed by prune');

				const downloadPromise = page.waitForEvent('download');
				await poHomeChannel.content.lastUserMessage.getByRole('link', { name: 'Download' }).click();
				const download = await downloadPromise;
				expect(await download.failure()).toBeTruthy();
			});

			await setSettingValueById(api, 'FileUpload_FileSystemPath', `/tmp/rc-test-ufs-local-1`);

			await test.step('attempt to download after setting back the path', async () => {
				const downloadPromise = page.waitForEvent('download');
				await poHomeChannel.content.lastUserMessage.getByRole('link', { name: 'Download' }).click();
				const download = await downloadPromise;
				expect(await download.failure()).toBeNull();
			});

			await test.step('attempt to prune after setting back the path', async () => {
				await expect(poHomeChannel.content.lastUserMessage).toContainText('test-large-image.jpeg');
				await pruneMessages(page, { filesOnly: true });
				await expect(page.getByText('1 message pruned')).toBeVisible();
			});

			await test.step('check if the message is pruned', async () => {
				await page.reload();
				await expect(poHomeChannel.content.lastUserMessage).toContainText('File removed by prune');
			});
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

async function sendFileMessage(poHomeChannel: HomeChannel, fileName: string) {
	await poHomeChannel.content.sendFileMessage(fileName);
	await poHomeChannel.content.fileNameInput.fill(fileName);
	await poHomeChannel.content.descriptionInput.fill(`${fileName} description`);
	return poHomeChannel.content.btnModalConfirm.click();
}
