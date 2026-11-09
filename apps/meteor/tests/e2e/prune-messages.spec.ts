import type { IRoom } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';

import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects/home-channel';
import { createDiscussion, createTargetChannelAndReturnFullRoom, deleteRoom, sendTargetChannelMessage } from './utils';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe('prune-messages', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: IRoom;

	test.beforeAll('create target channel', async ({ api }) => {
		targetChannel = (await (await api.post('/channels.create', { name: Random.id() })).json()).channel;
	});

	test.afterAll('delete target channel', async ({ api }) => {
		expect((await api.post('/channels.delete', { roomId: targetChannel._id })).status()).toBe(200);
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		await poHomeChannel.gotoChannelCleanHistory(targetChannel.fname as string);
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
				toastMessage,
			} = poHomeChannel;

			await content.sendFileMessage('any_file.txt');
			await expect(content.composer.getFileByName('any_file.txt')).toBeVisible();
			await poHomeChannel.composer.btnSend.click();
			await expect(content.getLastMessageByFileName('any_file.txt')).toBeVisible();

			await sendTargetChannelMessage(api, targetChannel.fname as string, {
				msg: 'a message without files',
			});

			await sendTargetChannelMessage(api, targetChannel.fname as string, {
				msg: 'a pinned message without files',
				pinned: true,
			});

			await test.step('prune files only not pinned', async () => {
				await pruneMessages.checkboxDeletePinned.click();
				await pruneMessages.selectContentOption('Only files');
				await pruneMessages.prune();
				await toastMessage.waitForDisplay({ type: 'success', message: '1 file pruned' });
				await toastMessage.dismissToast();
				await expect(pruneMessages.selectContent, 'Select is reset after success').toContainText('Messages and files');
				await expect(pruneMessages.checkboxDeletePinned, 'Checkbox is reset after success').toBeChecked();
			});

			await test.step('prune files only again', async () => {
				await pruneMessages.checkboxDeletePinned.click();
				await pruneMessages.selectContentOption('Only files');
				await pruneMessages.prune();
				await toastMessage.waitForDisplay({ type: 'error', message: 'No files found to prune' });
				await toastMessage.dismissToast('error');
				await expect(pruneMessages.selectContent, 'Select retains value after error').toContainText('Only files');
				await expect(pruneMessages.checkboxDeletePinned, 'Checkbox retains value after error').not.toBeChecked();
			});

			await test.step('prune messages and files', async () => {
				await pruneMessages.selectContentOption('Messages and files');
				await pruneMessages.prune();
				await toastMessage.waitForDisplay({ type: 'success', message: '3 messages pruned' });
				await toastMessage.dismissToast();
				await expect(pruneMessages.checkboxDeletePinned, 'Checkbox is reset after success').toBeChecked();
			});

			await test.step('prune remained pinned message', async () => {
				await pruneMessages.prune();
				await toastMessage.waitForDisplay({ type: 'success', message: '1 message pruned' });
				await toastMessage.dismissToast();
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
				toastMessage,
			} = poHomeChannel;

			await content.sendFileMessage('any_file.txt');
			await poHomeChannel.composer.btnSend.click();
			await expect(content.getLastMessageByFileName('any_file.txt')).toBeVisible();

			await test.step('prune files only', async () => {
				await pruneMessages.selectContentOption('Only files');
				await pruneMessages.prune();
				await toastMessage.waitForDisplay({ type: 'success', message: '1 file pruned' });
				await toastMessage.dismissToast();
				await expect(pruneMessages.selectContent, 'Select is reset after success').toContainText('Messages and files');
			});

			await test.step('check message list for prune message-attachment', async () => {
				await expect(content.getLastMessageByFileName('any_file.txt')).not.toBeVisible();
				await expect(content.lastMessageTextAttachment, 'Prune message attachment replaces file attachment').toHaveText('File deleted');
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
			await poHomeChannel.composer.btnSend.click();
			await expect(content.getLastMessageByFileName('any_file.txt')).toBeVisible();

			await content.openReplyInThread();
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
				await expect(content.getLastThreadMessageByFileName('any_file.txt')).not.toBeVisible();
				await expect(content.lastThreadMessageTextAttachment, 'Prune message attachment replaces file attachment').toHaveText(
					'File deleted',
				);
			});
		},
	);
});

test.describe('prune-messages with a discussion started from a file message', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: IRoom;

	test.beforeEach(async ({ api, page }) => {
		({ channel: targetChannel } = await createTargetChannelAndReturnFullRoom(api));
		poHomeChannel = new HomeChannel(page);
		await poHomeChannel.gotoChannelCleanHistory(targetChannel.name as string);

		await poHomeChannel.content.sendFileMessage('any_file.txt');
		await poHomeChannel.composer.btnSend.click();
		await expect(poHomeChannel.content.getLastMessageByFileName('any_file.txt')).toBeVisible();

		const originId = await poHomeChannel.content.lastUserMessage.getAttribute('data-id');
		await createDiscussion(api, targetChannel._id, originId as string, Random.id());
	});

	test.afterEach(async ({ api }) => {
		await deleteRoom(api, targetChannel._id);
	});

	test(
		'should keep the message a discussion started from, with its file, when original discussion messages are not deleted',
		{
			tag: '@channel',
			annotation: {
				type: 'issue',
				description: 'https://rocketchat.atlassian.net/browse/CORE-2696',
			},
		},
		async ({ api }) => {
			const {
				content,
				tabs: { pruneMessages },
				toastMessage,
			} = poHomeChannel;

			await sendTargetChannelMessage(api, targetChannel.name as string, { msg: 'a message without files' });

			await pruneMessages.checkboxDeleteDiscussion.click();
			await pruneMessages.checkboxDeleteDiscussionOrigin.click();
			await pruneMessages.prune();
			await toastMessage.waitForDisplay({ type: 'success', message: '1 message pruned' });

			await expect(content.getLastMessageByFileName('any_file.txt')).toBeVisible();
		},
	);
});
