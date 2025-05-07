/* eslint-disable react-hooks/rules-of-hooks */
import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel } from './utils';
import { test as baseTest, expect } from './utils/test';

const FILE_SYSTEM_PATHS = {
	STABLE: '/tmp/rc-test-ufs-local-0',
	CHANGED: '/tmp/rc-test-ufs-local-1',
	TEMPORARY: '/tmp/rc-test-ufs-local-2',
};

const FILE_NAMES = {
	FILE_1: 'number1.png',
	FILE_2: 'number2.png',
};

type SettingsFixture = {
	settings: {
		set: (settingId: string, value: unknown) => Promise<void>;
	};
};

const test = baseTest.extend<SettingsFixture>({
	settings: [
		async ({ api }, use) => {
			const set = async (settingId: string, value: unknown) => {
				const response = await api.post(`/settings/${settingId}`, { value });
				expect(response.status()).toBe(200);
			};
			await use({ set });
		},
		{},
	],
});

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
		test.beforeAll('set storage type to FileSystem', async ({ settings }) => {
			await settings.set('FileUpload_Storage_Type', 'FileSystem');
		});

		test.afterAll('reset storage type to GridFS', async ({ settings }) => {
			await settings.set('FileUpload_Storage_Type', 'GridFS');
		});

		test('should prune with stable path', async ({ page, settings }) => {
			await settings.set('FileUpload_FileSystemPath', FILE_SYSTEM_PATHS.STABLE);
			await sendFileMessage(poHomeChannel, FILE_NAMES.FILE_1);

			let downloadUrl: string;

			await test.step('download succeeds', async () => {
				const downloadPromise = page.waitForEvent('download', (d) => d.suggestedFilename() === FILE_NAMES.FILE_1);
				await poHomeChannel.content.lastUserMessage.getByRole('link', { name: 'Download' }).click();
				const download = await downloadPromise;
				expect(await download.failure()).toBeNull();
				downloadUrl = download.url();
			});

			await pruneMessages(poHomeChannel, { filesOnly: true });

			await test.step('download fails with not found (404)', async () => {
				const download = await fetch(downloadUrl);
				expect(download.status).toBe(404);
			});

			await pruneMessages(poHomeChannel, { filesOnly: false });
		});

		test('should prune after changing path', async ({ settings }) => {
			await settings.set('FileUpload_FileSystemPath', FILE_SYSTEM_PATHS.CHANGED);
			await sendFileMessage(poHomeChannel, FILE_NAMES.FILE_2);

			let downloadUrl: string;
			await test.step('download succeeds', async () => {
				const downloadPromise = poHomeChannel.page.waitForEvent('download', (d) => d.suggestedFilename() === FILE_NAMES.FILE_2);
				await poHomeChannel.content.lastUserMessage.getByRole('link', { name: 'Download' }).click();
				const download = await downloadPromise;
				expect(await download.failure()).toBeNull();
				downloadUrl = download.url();
			});

			await settings.set('FileUpload_FileSystemPath', FILE_SYSTEM_PATHS.TEMPORARY);
			await pruneMessages(poHomeChannel, { filesOnly: true });

			await test.step('download fails with status 403 (forbidden)', async () => {
				const download = await fetch(downloadUrl);
				expect(download.status).toBe(403);
			});

			await settings.set('FileUpload_FileSystemPath', FILE_SYSTEM_PATHS.CHANGED);

			await test.step('download succeeds', async () => {
				const downloadPromise = poHomeChannel.page.waitForEvent('download', (d) => d.suggestedFilename() === FILE_NAMES.FILE_2);
				await poHomeChannel.content.lastUserMessage.getByRole('link', { name: 'Download' }).click();
				const download = await downloadPromise;
				expect(await download.failure()).toBeNull();
				downloadUrl = download.url();
			});

			await pruneMessages(poHomeChannel, { filesOnly: true });

			await test.step('download fails with status 404 (not found)', async () => {
				const download = await fetch(downloadUrl);
				expect(download.status).toBe(404);
			});

			await pruneMessages(poHomeChannel, { filesOnly: false });
		});
	});
});

type PruneMessagesOptions = {
	filesOnly: boolean;
};

async function pruneMessages(poHomeChannel: HomeChannel, { filesOnly }: PruneMessagesOptions) {
	await test.step(
		`prune messages with filesOnly=${filesOnly}`,
		async () => {
			const { page, content, toast } = poHomeChannel;

			const form = page.getByLabel('Prune Messages');
			await form.getByRole('checkbox', { name: 'Only remove the attached files, keep messages' }).setChecked(filesOnly, { force: true });
			await form.getByRole('button', { name: 'Prune' }).click();

			const modal = page.getByLabel('Are you sure?');
			await modal.getByRole('button', { name: 'Yes, prune them!' }).click();

			await expect(toast.getByText(/1 message pruned|messages pruned|No messages found to prune/)).toBeVisible();
			await toast.getByLabel('Dismiss alert').click();

			await expect(content.lastUserMessage).toBeVisible({ visible: filesOnly });
		},
		{ box: true },
	);
}

async function sendFileMessage({ content }: HomeChannel, fileName: string) {
	await test.step(
		`send message with file '${fileName}'`,
		async () => {
			await content.sendFileMessage(fileName);
			await content.fileNameInput.fill(fileName);
			await content.descriptionInput.fill(`${fileName} description`);
			await content.btnModalConfirm.click();
			await expect(content.lastUserMessage).toContainText(fileName);
		},
		{ box: true },
	);
}
