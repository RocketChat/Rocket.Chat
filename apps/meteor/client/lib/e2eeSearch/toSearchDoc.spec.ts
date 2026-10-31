import type { IMessage } from '@rocket.chat/core-typings';
import { E2EE_SEARCH_LIMITS } from '@rocket.chat/desktop-api';

import { cutSearchDocBody, isDecryptFailed, isDeletionPlaceholder, toSearchDoc } from './toSearchDoc';

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
		...fields,
	}) as IMessage;

describe('toSearchDoc', () => {
	it('copies text, identity, and timestamps without changing the message', () => {
		const message = decrypted({
			content: { algorithm: 'rc.v2.aes-sha2', ciphertext: 'encrypted text', iv: 'iv', kid: 'key' },
		});
		expect(message.content).toMatchObject({ algorithm: 'rc.v2.aes-sha2' });
		const before = JSON.stringify(message);
		expect(toSearchDoc(message)).toEqual({
			id: 'm1',
			rid: 'r1',
			uid: 'u1',
			username: 'alice',
			ts: ts.getTime(),
			updatedAt: updatedAt.getTime(),
			kind: 'text',
			body: 'hello world',
		});
		expect(JSON.stringify(message)).toBe(before);
	});

	it('keeps edited text and thread identity without indexing replies', () => {
		expect(toSearchDoc(decrypted({ msg: 'edited', tmid: 'parent', replies: ['u2'], tcount: 1 }))).toMatchObject({
			body: 'edited',
			tmid: 'parent',
			updatedAt: updatedAt.getTime(),
		});
	});

	it('indexes legacy decrypted messages without content', () => {
		const message = decrypted();
		expect(message).not.toHaveProperty('content');
		expect(toSearchDoc(message)).toEqual({
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

	it('puts captions before deduplicated filenames', () => {
		const file = { _id: 'f1', name: 'report.pdf', type: 'application/pdf', size: 10, format: 'pdf' };
		const message = decrypted({
			msg: 'see report',
			file,
			files: [file],
			attachments: [{ type: 'file', title: 'report.pdf', description: 'caption', image_alt: 'chart', fileId: 'f1' }],
		} as Partial<IMessage>);
		expect(toSearchDoc(message)).toMatchObject({ kind: 'file', body: 'see report\ncaption\nchart\nreport.pdf' });
	});

	it('indexes attachment-only captions', () => {
		expect(toSearchDoc(decrypted({ msg: '', attachments: [{ title: 'Build 42', text: 'passed' }] } as Partial<IMessage>))).toMatchObject({
			kind: 'attachment',
			body: 'Build 42\npassed',
		});
	});

	it('excludes quoted and removed-file text', () => {
		const message = decrypted({
			msg: 'answer',
			attachments: [
				{ message_link: 'https://chat.example/group/x?msg=q1', text: 'quoted secret', author_name: 'bob', author_icon: '' },
				{ type: 'removed-file', title: 'removed secret', fileId: 'f1' },
			],
		} as Partial<IMessage>);
		expect(toSearchDoc(message)).toMatchObject({ body: 'answer', kind: 'text' });
	});

	it.each([
		{ t: 'uj' },
		{ t: 'rm' },
		{ t: 'message_pinned_e2e' },
		{ e2e: 'pending' },
		{ decryptFailed: true },
		{ msg: ' \n ' },
		{ _id: '' },
		{ rid: '' },
		{ u: { _id: '', username: 'x' } },
		{ ts: new Date(NaN) },
	])('does not index invalid or unreadable messages: %j', (fields) => {
		expect(toSearchDoc(decrypted(fields as Partial<IMessage>))).toBeUndefined();
	});

	it('uses the message timestamp when the update timestamp is absent or invalid', () => {
		expect(toSearchDoc(decrypted({ _updatedAt: undefined }))).toMatchObject({ updatedAt: ts.getTime() });
		expect(toSearchDoc(decrypted({ _updatedAt: new Date(NaN) }))).toMatchObject({ updatedAt: ts.getTime() });
	});

	it('distinguishes decrypt failures and deletion placeholders', () => {
		expect(isDecryptFailed(decrypted({ decryptFailed: true }))).toBe(true);
		expect(isDecryptFailed(decrypted())).toBe(false);
		expect(isDeletionPlaceholder(decrypted({ t: 'rm' }))).toBe(true);
	});

	it('removes long URL tails and preserves short ones', () => {
		expect(toSearchDoc(decrypted({ msg: `read https://example.com/docs?utm=${'x'.repeat(80)}#top now` }))?.body).toBe(
			'read https://example.com/docs now',
		);
		expect(toSearchDoc(decrypted({ msg: 'see https://example.com/search?q=budget' }))?.body).toBe(
			'see https://example.com/search?q=budget',
		);
	});

	it('caps bodies at the shared UTF-16 bound without splitting surrogate pairs', () => {
		const max = E2EE_SEARCH_LIMITS.maxDocumentBodyCodeUnits;
		expect(toSearchDoc(decrypted({ msg: 'x'.repeat(max) }))?.body).toHaveLength(max);
		expect(toSearchDoc(decrypted({ msg: `${'x'.repeat(max - 1)}😀tail` }))?.body).toBe('x'.repeat(max - 1));
		expect(cutSearchDocBody('😀', 1)).toBe('');
		expect(cutSearchDocBody('abc', 0)).toBe('');
	});

	it.each([-1, NaN, Infinity, 1.5, E2EE_SEARCH_LIMITS.maxDocumentBodyCodeUnits + 1])('rejects an invalid body bound %p', (max) => {
		expect(() => cutSearchDocBody('text', max)).toThrow(RangeError);
	});
});
