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
		await page.goto(`/channel/${targetChannel}/clean-history`);
	});

	test.describe('with attached files in FileSystem', () => {
		test.beforeAll('set storage type to FileSystem', async ({ api }) => {
			await setSettingValueById(api, 'FileUpload_Storage_Type', 'FileSystem');
		});

		test.afterAll('reset storage type to GridFS', async ({ api }) => {
			await setSettingValueById(api, 'FileUpload_Storage_Type', 'GridFS');
		});

		test('should prune with stable path', async ({ page, api }) => {
			await setSettingValueById(api, 'FileUpload_FileSystemPath', `/tmp/rc-test-ufs-local-0`);

			await test.step('send file message', async () => {
				await sendFileMessage(poHomeChannel, 'number1.png');
				await expect(poHomeChannel.content.lastUserMessage).toContainText('number1.png');
			});

			await test.step('prune filesOnly succeeds', async () => {
				await pruneMessages(page, { filesOnly: true });
				await expect(page.getByText('1 message pruned')).toBeVisible();
			});

			await test.step('download fails', async () => {
				const downloadPromise = page.waitForEvent('download', (d) => d.suggestedFilename() === 'number1.png');
				await poHomeChannel.content.lastUserMessage.getByRole('link', { name: 'Download' }).click();
				const download = await downloadPromise;
				expect(await download.failure()).toBeTruthy();
			});

			await test.step('prune succeeds', async () => {
				await expect(poHomeChannel.content.lastUserMessage).toContainText('number1.png');
				await pruneMessages(page, { filesOnly: false });
				await expect(page.getByText('1 message pruned')).toBeVisible();
				await expect(poHomeChannel.content.lastUserMessage).not.toBeVisible();
			});
		});

		test('should prune after changing path', async ({ page, api }) => {
			await setSettingValueById(api, 'FileUpload_FileSystemPath', `/tmp/rc-test-ufs-local-1`);

			await test.step('send file message', async () => {
				await sendFileMessage(poHomeChannel, 'number2.png');
				await expect(poHomeChannel.content.lastUserMessage).toContainText('number2.png');
			});

			await setSettingValueById(api, 'FileUpload_FileSystemPath', '/tmp/rc-test-ufs-local-2');

			await test.step('prune filesOnly fails', async () => {
				await pruneMessages(page, { filesOnly: true });
				await expect(page.getByText('No messages found to prune')).toBeVisible();
			});

			await test.step('download fails', async () => {
				const downloadPromise = page.waitForEvent('download', (d) => d.suggestedFilename() === 'number2.png');
				await poHomeChannel.content.lastUserMessage.getByRole('link', { name: 'Download' }).click();
				const download = await downloadPromise;
				expect(await download.failure()).toBeTruthy();
			});

			await setSettingValueById(api, 'FileUpload_FileSystemPath', `/tmp/rc-test-ufs-local-1`);

			await test.step('download succeeds', async () => {
				const downloadPromise = page.waitForEvent('download', (d) => d.suggestedFilename() === 'number2.png');
				await poHomeChannel.content.lastUserMessage.getByRole('link', { name: 'Download' }).click();
				const download = await downloadPromise;
				expect(await download.failure()).toBeNull();
			});

			await test.step('prune filesOnly succeeds', async () => {
				await expect(poHomeChannel.content.lastUserMessage).toContainText('number2.png');
				await pruneMessages(page, { filesOnly: true });
				await expect(page.getByText('1 message pruned')).toBeVisible();
			});

			await test.step('download fails', async () => {
				const downloadPromise = page.waitForEvent('download', (d) => d.suggestedFilename() === 'number2.png');
				await poHomeChannel.content.lastUserMessage.getByRole('link', { name: 'Download' }).click();
				const download = await downloadPromise;
				expect(await download.failure()).toBeTruthy();
			});

			await test.step('prune succeeds', async () => {
				await pruneMessages(page, { filesOnly: false });
				await expect(page.getByText('1 message pruned')).toBeVisible();
				await expect(poHomeChannel.content.lastUserMessage).not.toBeVisible();
			});
		});
	});
});

type PruneMessagesOptions = {
	filesOnly: boolean;
};

async function pruneMessages(page: Page, { filesOnly }: PruneMessagesOptions) {
	await page.locator('span').filter({ hasText: 'Only remove the attached' }).locator('i').setChecked(filesOnly);
	await page.getByRole('button', { name: 'Prune' }).click();
	return page.getByRole('button', { name: 'Yes, prune them!' }).click();
}

async function sendFileMessage(poHomeChannel: HomeChannel, fileName: string) {
	await poHomeChannel.content.sendFileMessage(fileName);
	await poHomeChannel.content.fileNameInput.fill(fileName);
	await poHomeChannel.content.descriptionInput.fill(`${fileName} description`);
	return poHomeChannel.content.btnModalConfirm.click();
}
