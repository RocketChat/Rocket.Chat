import type { IMessage } from '@rocket.chat/core-typings';

import { MAX_SEARCH_DOC_BODY_LENGTH, toSearchDoc } from './toSearchDoc';

const ts = new Date('2026-10-01T10:00:00.000Z');
const updatedAt = new Date('2026-10-01T10:05:00.000Z');

const decrypted = (fields: Partial<IMessage> & Record<string, unknown> = {}): IMessage =>
	({
		_id: 'm1',
		rid: 'r1',
		u: { _id: 'u1', username: 'alice' },
		ts,
		_updatedAt: updatedAt,
		t: 'e2e',
		e2e: 'done',
		msg: 'hello world',
		content: { algorithm: 'rc.v2.aes-sha2', kid: 'k', iv: 'iv', ciphertext: 'c' },
		...fields,
	}) as unknown as IMessage;

describe('toSearchDoc', () => {
	describe('message types of the 0.3 field table', () => {
		it('text message (useE2EEncryption encryptMessage): body is msg, ids and times copied', () => {
			expect(toSearchDoc(decrypted())).toEqual({
				id: 'm1',
				rid: 'r1',
				uid: 'u1',
				username: 'alice',
				ts: ts.getTime(),
				updatedAt: updatedAt.getTime(),
				kind: 'text',
				body: 'hello world',
			});
		});

		it('edited message: the new text and the newer _updatedAt', () => {
			const editedAt = new Date('2026-10-02T08:00:00.000Z');
			const doc = toSearchDoc(decrypted({ msg: 'hello edited', editedAt, _updatedAt: editedAt }));

			expect(doc).toMatchObject({ id: 'm1', body: 'hello edited', updatedAt: editedAt.getTime(), ts: ts.getTime() });
		});

		it('thread reply: tmid copied', () => {
			expect(toSearchDoc(decrypted({ tmid: 'parent1' }))).toMatchObject({ tmid: 'parent1', kind: 'text' });
		});

		it('legacy v1 message (msg decrypted in place, no content): indexed like a text message', () => {
			const message = decrypted({ msg: 'legacy text' });
			delete (message as Partial<IMessage>).content;

			expect(toSearchDoc(message)).toMatchObject({ kind: 'text', body: 'legacy text' });
		});

		it('file upload: msg, attachment description and image alt, then the file names (PROD-642)', () => {
			const doc = toSearchDoc(
				decrypted({
					msg: 'see the report',
					file: { _id: 'f1', name: 'q3-report.pdf', type: 'application/pdf', size: 10, format: 'pdf' },
					files: [
						{ _id: 'f1', name: 'q3-report.pdf', type: 'application/pdf', size: 10, format: 'pdf' },
						{ _id: 'f2', name: 'chart.png', type: 'image/png', size: 10, format: 'png' },
					],
					attachments: [
						{ type: 'file', title: 'q3-report.pdf', description: 'quarterly numbers', fileId: 'f1', title_link: '/file-upload/f1' },
						{ type: 'file', title: 'chart.png', image_url: '/file-upload/f2', image_alt: 'revenue chart', fileId: 'f2' },
					],
				} as Partial<IMessage>),
			);

			expect(doc?.kind).toBe('file');
			expect(doc?.body.split('\n')).toEqual(['see the report', 'quarterly numbers', 'revenue chart', 'q3-report.pdf', 'chart.png']);
		});

		it('file upload with a caption and no message text (mobile and older web clients): the caption comes first (PROD-642)', () => {
			const file = { _id: 'f1', name: 'Screenshot 2026-10-01 at 13.45.02.png', type: 'image/png', size: 10, format: 'png' };
			const doc = toSearchDoc(
				decrypted({
					msg: '',
					file,
					files: [file],
					attachments: [{ type: 'file', title: file.name, description: 'the board numbers', image_url: '/file-upload/f1', fileId: 'f1' }],
				} as Partial<IMessage>),
			);

			expect(doc).toMatchObject({ kind: 'file', body: 'the board numbers\nScreenshot 2026-10-01 at 13.45.02.png' });
		});

		it('quote: the quoted text that the client adds at decrypt time is not indexed under the quoting message', () => {
			const doc = toSearchDoc(
				decrypted({
					msg: '[ ](https://chat.example/group/x?msg=q1) my answer',
					attachments: [
						{ message_link: 'https://chat.example/group/x?msg=q1', text: 'secret quoted words', author_name: 'bob', author_icon: '' },
					],
				} as Partial<IMessage>),
			);

			expect(doc?.body).not.toContain('secret quoted words');
			expect(doc?.body).toContain('my answer');
			expect(doc?.kind).toBe('text');
		});

		it('removed file: the attachment that marks a deleted file gives no text', () => {
			const doc = toSearchDoc(
				decrypted({
					msg: '',
					attachments: [{ type: 'removed-file', title: 'File removed by alice', fileId: 'f1' }],
				} as Partial<IMessage>),
			);

			expect(doc).toBeUndefined();
		});

		it('pinned message notice (system type message_pinned_e2e): no document', () => {
			expect(
				toSearchDoc(
					decrypted({ t: 'message_pinned_e2e', msg: 'pinned', attachments: [{ text: 'the pinned words' }] } as Partial<IMessage>),
				),
			).toBeUndefined();
		});

		it('non-file attachment text (bot or app attachment in an encrypted message): kind attachment', () => {
			const doc = toSearchDoc(decrypted({ msg: '', attachments: [{ title: 'Build 42', text: 'pipeline passed' }] } as Partial<IMessage>));

			expect(doc).toMatchObject({ kind: 'attachment', body: 'Build 42\npipeline passed' });
		});
	});

	describe('messages that give no document', () => {
		it('a system message', () => {
			expect(toSearchDoc(decrypted({ t: 'uj' } as Partial<IMessage>))).toBeUndefined();
		});

		it('a message that is not decrypted yet', () => {
			expect(toSearchDoc(decrypted({ e2e: 'pending' }))).toBeUndefined();
		});

		it('a message that is not end-to-end encrypted', () => {
			const message = decrypted();
			delete (message as Partial<IMessage>).t;
			delete (message as Partial<IMessage>).e2e;

			expect(toSearchDoc(message)).toBeUndefined();
		});

		it('an empty or whitespace-only body', () => {
			expect(toSearchDoc(decrypted({ msg: '  \n ' }))).toBeUndefined();
		});

		it('a message with no sender id', () => {
			expect(toSearchDoc(decrypted({ u: { _id: '', username: 'x' } }))).toBeUndefined();
		});
	});

	describe('text cleanup', () => {
		it('removes a long URL query string and keeps the URL path', () => {
			const tracking = `utm_source=${'x'.repeat(80)}`;
			const doc = toSearchDoc(decrypted({ msg: `read https://example.com/docs/page?${tracking}#top now` }));

			expect(doc?.body).toBe('read https://example.com/docs/page now');
		});

		it('keeps a short URL query string', () => {
			const doc = toSearchDoc(decrypted({ msg: 'see https://example.com/search?q=budget' }));

			expect(doc?.body).toBe('see https://example.com/search?q=budget');
		});

		it('caps the body at the backend limit without splitting a surrogate pair', () => {
			const doc = toSearchDoc(decrypted({ msg: `${'a'.repeat(MAX_SEARCH_DOC_BODY_LENGTH - 1)}😀tail` }));

			expect(doc?.body.length).toBeLessThanOrEqual(MAX_SEARCH_DOC_BODY_LENGTH);
			expect(doc?.body.endsWith('\uD83D')).toBe(false);
		});

		it('does not change the message it reads', () => {
			const message = decrypted({ msg: `x https://e.com/?${'a'.repeat(100)}` });
			const before = JSON.stringify(message);
			toSearchDoc(message);

			expect(JSON.stringify(message)).toBe(before);
		});
	});
});
