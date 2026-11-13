import type { IMessage, MessageAttachment } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';
import { createElement } from 'react';

import { useNormalizedMessage } from './useNormalizedMessage';
import { createFakeMessage } from '../../../../tests/mocks/data';
import { MessageListContext, messageListContextDefaultValue } from '../list/MessageListContext';

const encryption = { key: { kty: 'oct' }, iv: 'initialization-vector' };

const buildAttachment = (fields: Record<string, unknown>) =>
	({ type: 'file', title: 'file', title_link: '/file-upload/id/file', encryption, ...fields }) as unknown as MessageAttachment;

const normalize = (message: Partial<IMessage>) =>
	renderHook(() => useNormalizedMessage(createFakeMessage(message)), { wrapper: mockAppRoot().build() }).result.current;

const firstAttachment = (message: Partial<IMessage>) => normalize(message).attachments?.[0] as unknown as Record<string, string>;

const readKey = (url: string) => JSON.parse(atob(decodeURIComponent(url.split('?key=')[1])));

describe('useNormalizedMessage', () => {
	it('should parse the message text', () => {
		expect(normalize({ msg: 'hello' }).md).toEqual([expect.objectContaining({ type: 'PARAGRAPH' })]);
	});

	it('should read an emoticon in the text as an emoji', () => {
		expect(JSON.stringify(normalize({ msg: ':)' }).md)).toContain('"EMOJI"');
	});

	describe('with math formulas', () => {
		const renderWithKatex = (katex?: { dollarSyntaxEnabled: boolean; parenthesisSyntaxEnabled: boolean }) =>
			renderHook(() => useNormalizedMessage(createFakeMessage({ msg: 'see $x^2$ and \\(y^2\\)' })), {
				wrapper: mockAppRoot()
					.wrap((children) => createElement(MessageListContext.Provider, { value: { ...messageListContextDefaultValue, katex } }, children))
					.build(),
			}).result.current.md;

		const countFormulas = (md: unknown) => JSON.stringify(md).split('"INLINE_KATEX"').length - 1;

		it('should parse no formula when math is off', () => {
			expect(countFormulas(renderWithKatex())).toBe(0);
		});

		it('should parse the dollar syntax when it is on', () => {
			expect(countFormulas(renderWithKatex({ dollarSyntaxEnabled: true, parenthesisSyntaxEnabled: false }))).toBe(1);
		});

		it('should parse the parenthesis syntax when it is on', () => {
			expect(countFormulas(renderWithKatex({ dollarSyntaxEnabled: false, parenthesisSyntaxEnabled: true }))).toBe(1);
		});
	});

	it('should leave an attachment with no encryption as it is', () => {
		const attachment = buildAttachment({ encryption: undefined, image_url: '/file-upload/id/image', image_type: 'image/png' });

		expect(firstAttachment({ attachments: [attachment] })).toMatchObject({
			title_link: '/file-upload/id/file',
			image_url: '/file-upload/id/image',
		});
	});

	it.each([
		['image', { image_url: '/file-upload/id/media', image_type: 'image/png' }, 'image_url'],
		['audio', { audio_url: '/file-upload/id/media', audio_type: 'audio/mpeg' }, 'audio_url'],
		['video', { video_url: '/file-upload/id/media', video_type: 'video/mp4' }, 'video_url'],
	])('should send an encrypted %s and its link through the decrypt route', (_type, fields, urlField) => {
		const attachment = firstAttachment({ attachments: [buildAttachment(fields)] });

		expect(attachment[urlField]).toMatch(/^\/file-decrypt\/file-upload\/id\/media\?key=/);
		expect(attachment.title_link).toMatch(/^\/file-decrypt\/file-upload\/id\/file\?key=/);
	});

	it.each([
		['link', { title_link: '/file-decrypt/file-upload/id/file?key=old' }, 'title_link'],
		['image', { image_url: '/file-decrypt/file-upload/id/media?key=old', image_type: 'image/png' }, 'image_url'],
		['audio', { audio_url: '/file-decrypt/file-upload/id/media?key=old', audio_type: 'audio/mpeg' }, 'audio_url'],
		['video', { video_url: '/file-decrypt/file-upload/id/media?key=old', video_type: 'video/mp4' }, 'video_url'],
	])('should not rewrite a %s that already uses the decrypt route', (_type, fields, urlField) => {
		const attachment = firstAttachment({ attachments: [buildAttachment(fields)] });

		expect(attachment[urlField]).toMatch(/\?key=old$/);
	});

	it('should put the encryption data, the file name and the file type in the key', () => {
		const attachment = firstAttachment({
			file: { _id: 'file-id', name: 'report.pdf', type: 'application/pdf' } as IMessage['file'],
			attachments: [buildAttachment({})],
		});

		expect(readKey(attachment.title_link)).toEqual({ ...encryption, name: 'report.pdf', type: 'application/pdf' });
	});

	it('should leave the file name out of the key of a message with no file', () => {
		const attachment = firstAttachment({ attachments: [buildAttachment({})] });

		expect(readKey(attachment.title_link)).toEqual(encryption);
	});

	it('should not rewrite the link of an encrypted attachment that is not a file', () => {
		const attachment = firstAttachment({ attachments: [buildAttachment({ type: 'other' })] });

		expect(attachment.title_link).toBe('/file-upload/id/file');
	});

	it('should accept a file name with characters outside Latin-1', () => {
		const attachment = firstAttachment({
			file: { _id: 'file-id', name: '報告.pdf', type: 'application/pdf' } as IMessage['file'],
			attachments: [buildAttachment({})],
		});

		const { name } = readKey(attachment.title_link);

		expect(new TextDecoder().decode(Uint8Array.from(name as string, (char) => char.charCodeAt(0)))).toBe('報告.pdf');
	});

	it('should process the attachments inside a quote', () => {
		const quote = {
			text: 'quoted',
			message_link: 'http://localhost/channel/general?msg=id',
			attachments: [buildAttachment({})],
		} as unknown as MessageAttachment;

		const [quoted] = firstAttachment({ attachments: [quote] }).attachments as unknown as Record<string, string>[];

		expect(quoted.title_link).toMatch(/^\/file-decrypt\//);
	});
});
