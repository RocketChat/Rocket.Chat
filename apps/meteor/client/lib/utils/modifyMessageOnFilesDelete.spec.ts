import type { IMessage, MessageAttachment, FileAttachmentProps, MessageQuoteAttachment } from '@rocket.chat/core-typings';

import { modifyMessageOnFilesDelete } from './modifyMessageOnFilesDelete';

global.structuredClone = (val: any) => JSON.parse(JSON.stringify(val));

const fileAttachment: FileAttachmentProps = { title: 'Image', title_link: 'url', image_url: 'image.png', type: 'file' };
const nonFileAttachment: MessageAttachment = { text: 'Non-file attachment', color: '#ff0000' };
const quoteAttachment: MessageQuoteAttachment = {
	text: 'Quoted message',
	message_link: 'some-link',
	attachments: [{ text: 'Quoted inner message' }],
	author_icon: 'icon',
	author_link: 'link',
	author_name: 'name',
};

const messageBase: IMessage = {
	_id: 'msg1',
	msg: 'Here is a file',
	file: {
		_id: 'file1',
		name: 'image.png',
		type: '',
		format: '',
		size: 0,
	},
	files: [
		{
			_id: 'file1',
			name: 'image.png',
			type: '',
			format: '',
			size: 0,
		},
	],
	attachments: [fileAttachment, nonFileAttachment, quoteAttachment],
	rid: '',
	ts: new Date().toISOString() as any,
	u: { username: 'username', _id: '12345' },
	_updatedAt: new Date().toISOString() as any,
};

const createMessage = () => {
	const msg = structuredClone(messageBase);
	return msg as IMessage;
};

describe('modifyMessageOnFilesDelete', () => {
	it('should remove `file`, empty `files`, and remove file-type attachments', () => {
		const message = createMessage();

		const result = modifyMessageOnFilesDelete(message);

		expect(result).not.toHaveProperty('file');
		expect(Array.isArray(result.files)).toBe(true);
		expect(result.files).toHaveLength(0);
		expect(result.attachments).toHaveLength(2);
		expect(result.attachments?.some((att) => att.text === 'Non-file attachment')).toBe(true);
	});

	it('should replace file-type attachments if `replaceFileAttachmentsWith` is provided', () => {
		const message = createMessage();

		const replacement: MessageAttachment = { text: 'File removed by prune' };

		const result = modifyMessageOnFilesDelete(message, replacement);

		expect(result).not.toHaveProperty('file');
		expect(Array.isArray(result.files)).toBe(true);
		expect(result.files).toHaveLength(0);
		expect(result.attachments?.some((att) => att.text === 'File removed by prune')).toBe(true);
	});

	it('should not mutate the original message', () => {
		const message = createMessage();

		const original = JSON.parse(JSON.stringify(message));
		modifyMessageOnFilesDelete(message);

		expect(message).toEqual(original);
	});

	it('should not remove non-file attachments such as text and quote', () => {
		const message = createMessage();

		const result = modifyMessageOnFilesDelete(message);

		expect(result.attachments?.some((att) => att.text === 'Non-file attachment')).toBe(true);
		expect(result.attachments?.some((att) => att.text === 'Quoted message')).toBe(true);
	});
});
