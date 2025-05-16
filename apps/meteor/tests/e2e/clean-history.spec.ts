import fs from 'fs';

import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { ToastBar } from './page-objects/toastBar';
import { setSettingValueById, createTargetChannel, sendTargetChannelMessage } from './utils';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe('clean-history', () => {
	const filePath = `/tmp/rc-e2e-uploads-${Math.random().toString(36).substring(2, 15)}`;
	let poHomeChannel: HomeChannel;
	let poToastBar: ToastBar;
	let targetChannel: string;

	test.beforeAll(async ({ api }) => {
		await setSettingValueById(api, 'FileUpload_Storage_Type', 'FileSystem');
		await setSettingValueById(api, 'FileUpload_FileSystemPath', filePath);
	});

	test.afterAll(async ({ api }) => {
		await setSettingValueById(api, 'FileUpload_Storage_Type', 'GridFS');
		await setSettingValueById(api, 'FileUpload_FileSystemPath', '');
	});

	test.beforeEach(async ({ page, api }) => {
		poToastBar = new ToastBar(page);
		poHomeChannel = new HomeChannel(page);

		targetChannel = await createTargetChannel(api, { members: [Users.admin.data.username] });

		await page.goto(`/channel/${targetChannel}/clean-history`);
	});

	test.afterEach(async ({ api }) => {
		await api.post('/channels.delete', { roomName: targetChannel });
	});

	test('should prune messages with files', async ({ api }) => {
		const {
			content,
			tabs: { pruneMessages },
		} = poHomeChannel;
		const { alert, dismiss } = poToastBar;

		await content.sendFileMessage('any_file.txt');
		await content.descriptionInput.fill('a message with a file');
		await content.btnModalConfirm.click();
		await expect(content.lastMessageFileName).toHaveText('any_file.txt');

		await sendTargetChannelMessage(api, targetChannel, {
			msg: 'a message without files',
		});

		await sendTargetChannelMessage(api, targetChannel, {
			msg: 'a pinned message without files',
			pinned: true,
		});

		await test.step('check if file is deleted from disk', async () => {
			const dir = await fs.promises.readdir(filePath);
			expect(dir).toHaveLength(1);
		});

		await test.step('prune files only not pinned', async () => {
			await pruneMessages.filesOnly.check({ force: true });
			await pruneMessages.prune();
			await expect(alert).toHaveText('1 file pruned');
			await dismiss.click();
			await expect(pruneMessages.filesOnly, 'Checkbox is reset after success').not.toBeChecked();
			await expect(pruneMessages.doNotPrunePinned, 'Checkbox is reset after success').not.toBeChecked();
		});

		await test.step('check if file is deleted from disk', async () => {
			const dir = await fs.promises.readdir(filePath);
			expect(dir).toHaveLength(0);
		});
	});
});
