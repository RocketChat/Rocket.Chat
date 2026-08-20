import type { IMessage, MessageAttachment } from '@rocket.chat/core-typings';

import { useKeepMountedMessages } from './useKeepMountedMessages';

const baseMessage = (overrides: Partial<IMessage> = {}): IMessage => ({
	_id: 'messageId',
	rid: 'roomId',
	msg: 'text',
	ts: new Date(),
	u: { _id: 'userId', username: 'userName' },
	_updatedAt: new Date(),
	...overrides,
});

const fileAttachment: MessageAttachment = { type: 'file' } as MessageAttachment;

const quoteAttachment = (attachments?: MessageAttachment[]): MessageAttachment =>
	({
		author_name: 'author',
		author_icon: 'icon',
		message_link: 'https://example.com/msg',
		text: 'quoted text',
		attachments,
	}) as MessageAttachment;

it('should not keep a plain text message mounted', () => {
	const messages = [baseMessage()];
	expect(useKeepMountedMessages(messages)).toEqual([]);
});

it('should keep a message with files mounted', () => {
	const messages = [baseMessage({ files: [{ _id: 'fileId', name: 'file', type: 'file' }] })];
	expect(useKeepMountedMessages(messages)).toEqual([0]);
});

it('should keep a message with a URL preview mounted', () => {
	const messages = [baseMessage({ urls: [{ url: 'https://example.com', meta: { ogTitle: 'title' } }] })];
	expect(useKeepMountedMessages(messages)).toEqual([0]);
});

it('should keep a message quoting a file attachment mounted', () => {
	const messages = [baseMessage({ attachments: [quoteAttachment([fileAttachment])] })];
	expect(useKeepMountedMessages(messages)).toEqual([0]);
});

it('should keep a message quoting a quote of a file attachment mounted (recursive)', () => {
	const messages = [baseMessage({ attachments: [quoteAttachment([quoteAttachment([fileAttachment])])] })];
	expect(useKeepMountedMessages(messages)).toEqual([0]);
});

it('should not keep a message quoting text (no nested file) mounted', () => {
	const messages = [baseMessage({ attachments: [quoteAttachment()] })];
	expect(useKeepMountedMessages(messages)).toEqual([]);
});

it('should offset indexes by one when canPreview is true', () => {
	const messages = [baseMessage(), baseMessage({ files: [{ _id: 'fileId', name: 'file', type: 'file' }] })];
	expect(useKeepMountedMessages(messages, true)).toEqual([2]);
});
