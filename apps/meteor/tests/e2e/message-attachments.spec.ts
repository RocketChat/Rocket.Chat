import type { MessageAttachment, MessageAttachmentDefault } from '@rocket.chat/core-typings';

import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel, deleteChannel } from './utils';
import { expect, test as baseTest } from './utils/test';

const test = baseTest.extend<{
	postMessage: (channel: string, text: string, attachments: MessageAttachment[]) => Promise<void>;
}>({
	postMessage: async ({ api }, uses) => {
		await uses(async (channel: string, text: string, attachments: MessageAttachment[]) => {
			await api.post('/chat.postMessage', {
				channel,
				text,
				attachments,
			});
		});
	},
});

test.use({ storageState: Users.user1.state });

const codeBlock = (text: string, language = ''): string => {
	return `\`\`\`${language}\n${text}\n\`\`\``;
};

const textAttachment = (...text: string[]): MessageAttachmentDefault => ({
	text: text.join('\n'),
});

test.describe('message-attachments', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: string;

	test.beforeEach(async ({ page, api }) => {
		targetChannel = await createTargetChannel(api);
		poHomeChannel = new HomeChannel(page);
		await page.goto('/home');
	});

	test.afterEach(({ api }) => deleteChannel(api, targetChannel));

	test('should display text attachments with > and < symbols in markdown codeblocks', async ({ page, postMessage }) => {
		await postMessage(targetChannel, 'One < Two < Three', [
			textAttachment(codeBlock('Six > Five > Four')),
			textAttachment(codeBlock('Seven < Eight < Nine')),
			textAttachment('Ten > Eleven > Twelve'),
			textAttachment('Thirteen < Fourteen < Fifteen'),
		]);
		await poHomeChannel.sidenav.openChat(targetChannel);
		await expect(page.getByText('One < Two < Three')).toBeVisible();
		await expect(page.getByText('Six > Five > Four')).toBeVisible();
		await expect(page.getByText('Seven < Eight < Nine')).toBeVisible();
		await expect(page.getByText('Ten > Eleven > Twelve')).toBeVisible();
		await expect(page.getByText('Thirteen < Fourteen < Fifteen')).toBeVisible();
	});

	test('should display single text attachment with > and < symbols in markdown codeblocks', async ({ page, postMessage }) => {
		await postMessage(targetChannel, 'One < Two < Three', [
			textAttachment(
				codeBlock('Six > Five > Four'),
				codeBlock('Seven < Eight < Nine'),
				'Ten > Eleven > Twelve',
				'Thirteen < Fourteen < Fifteen',
			),
		]);
		await poHomeChannel.sidenav.openChat(targetChannel);
		await expect(page.getByText('One < Two < Three')).toBeVisible();
		await expect(page.getByText('Six > Five > Four')).toBeVisible();
		await expect(page.getByText('Seven < Eight < Nine')).toBeVisible();
		await expect(page.getByText('Ten > Eleven > Twelve')).toBeVisible();
		await expect(page.getByText('Thirteen < Fourteen < Fifteen')).toBeVisible();
	});
});
