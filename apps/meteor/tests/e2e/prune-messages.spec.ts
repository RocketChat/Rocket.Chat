import type { IRoom } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';

import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects/home-channel';
import { ToastBar } from './page-objects/toastBar';
import { sendTargetChannelMessage } from './utils';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe('prune-messages', () => {
	let poHomeChannel: HomeChannel;
	let poToastBar: ToastBar;
	let targetChannel: IRoom;

	test.beforeAll('create target channel', async ({ api }) => {
		targetChannel = (await (await api.post('/channels.create', { name: Random.id() })).json()).channel;
	});

	test.afterAll('delete target channel', async ({ api }) => {
		expect((await api.post('/channels.delete', { roomId: targetChannel._id })).status()).toBe(200);
	});

	test.beforeEach(async ({ page }) => {
		poToastBar = new ToastBar(page);
		poHomeChannel = new HomeChannel(page);

		await page.goto(`/channel/${targetChannel.fname}/clean-history`);
	});

	test(
		'should reset form after pruning messages',
		{
			tag: '@channel',
			annotation: {
				type: 'issue',
				description: 'https://rocketchat.atlassian.net/browse/CORE-1146',
			},
		},
		async ({ api }) => {
			const {
				content,
				tabs: { pruneMessages },
			} = poHomeChannel;
			const { alert, dismiss } = poToastBar;

			await content.sendFileMessage('any_file.txt');
			await content.descriptionInput.fill('a message with a file');
			await content.btnModalConfirm.click();
			await expect(content.lastMessageFileName).toHaveText('any_file.txt');

			await sendTargetChannelMessage(api, targetChannel.fname as string, {
				msg: 'a message without files',
			});

			await sendTargetChannelMessage(api, targetChannel.fname as string, {
				msg: 'a pinned message without files',
				pinned: true,
			});

			await test.step('prune files only not pinned', async () => {
				await pruneMessages.doNotPrunePinned.check({ force: true });
				await pruneMessages.filesOnly.check({ force: true });
				await pruneMessages.prune();
				await expect(alert).toHaveText('1 file pruned');
				await dismiss.click();
				await expect(pruneMessages.filesOnly, 'Checkbox is reset after success').not.toBeChecked();
				await expect(pruneMessages.doNotPrunePinned, 'Checkbox is reset after success').not.toBeChecked();
			});

			await test.step('prune files only again', async () => {
				await pruneMessages.doNotPrunePinned.check({ force: true });
				await pruneMessages.filesOnly.check({ force: true });
				await pruneMessages.prune();
				await expect(alert).toHaveText('No files found to prune');
				await dismiss.click();
				await expect(pruneMessages.filesOnly, 'Checkbox retains value after error').toBeChecked();
				await expect(pruneMessages.doNotPrunePinned, 'Checkbox retains value after error').toBeChecked();
			});

			await test.step('uncheck files only', async () => {
				await pruneMessages.filesOnly.uncheck({ force: true });
				await pruneMessages.prune();
				await expect(alert).toHaveText('2 messages pruned');
				await dismiss.click();
				await expect(pruneMessages.filesOnly, 'Checkbox is reset after success').not.toBeChecked();
			});

			await test.step('uncheck do not prune pinned', async () => {
				await pruneMessages.doNotPrunePinned.uncheck({ force: true });
				await pruneMessages.prune();
				await expect(alert).toHaveText('1 message pruned');
				await dismiss.click();
				await expect(content.lastUserMessage).not.toBeVisible();
			});
		},
	);

	test(
		'should update message list on pruning files only',
		{
			tag: '@channel',
			annotation: {
				type: 'issue',
				description: 'https://rocketchat.atlassian.net/browse/CORE-1168',
			},
		},
		async () => {
			const {
				content,
				tabs: { pruneMessages },
			} = poHomeChannel;
			const { alert, dismiss } = poToastBar;

			await content.sendFileMessage('any_file.txt');
			await content.descriptionInput.fill('a message with a file');
			await content.btnModalConfirm.click();
			await expect(content.lastMessageFileName).toHaveText('any_file.txt');

			await test.step('prune files only', async () => {
				await pruneMessages.filesOnly.check({ force: true });
				await pruneMessages.prune();
				await expect(alert).toHaveText('1 file pruned');
				await dismiss.click();
				await expect(pruneMessages.filesOnly, 'Checkbox is reset after success').not.toBeChecked();
				await expect(pruneMessages.doNotPrunePinned, 'Checkbox is reset after success').not.toBeChecked();
			});

			await test.step('check message list for prune message-attachment', async () => {
				await expect(content.lastMessageFileName).not.toBeVisible();
				await expect(content.lastMessageTextAttachment, 'Prune message attachment replaces file attachment').toHaveText(
					'File removed by prune',
				);
			});
		},
	);

	test(
		'should update main thread message attachment on pruning files only',
		{
			tag: '@channel',
			annotation: {
				type: 'issue',
				description: 'https://rocketchat.atlassian.net/browse/CORE-1168',
			},
		},
		async ({ api }) => {
			const { content } = poHomeChannel;

			await content.sendFileMessage('any_file.txt');
			await content.descriptionInput.fill('a message with a file');
			await content.btnModalConfirm.click();
			await expect(content.lastMessageFileName).toHaveText('any_file.txt');

			await content.lastUserMessage.hover();
			await content.lastUserMessage.getByTitle('Reply in thread').click();
			expect(
				(
					await api.post('/rooms.cleanHistory', {
						roomId: targetChannel._id,
						filesOnly: true,
						latest: new Date(Date.now() + 30 * 24 * 3600), // in future
						oldest: new Date(Date.now() - 30 * 24 * 3600), // in past
					})
				).status(),
			).toBe(200);

			await test.step('check main thread message for prune message-attachment', async () => {
				await expect(content.lastThreadMessageFileName).not.toBeVisible();
				await expect(content.lastThreadMessageTextAttachment, 'Prune message attachment replaces file attachment').toHaveText(
					'File removed by prune',
				);
			});
		},
	);
});
