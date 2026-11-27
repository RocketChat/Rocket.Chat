import type { IMessage } from '@rocket.chat/core-typings';

import { createDataAPI } from './data';
import { NOW, behavior, getCalls, resetFakes, resetRandom } from './goldenFakes';

jest.mock('../SDKClient', () => jest.requireActual('./goldenFakes').sdkModule);
jest.mock('../user', () => jest.requireActual('./goldenFakes').userModule);
jest.mock('../settings', () => jest.requireActual('./goldenFakes').settingsModule);
jest.mock('../authorization', () => jest.requireActual('./goldenFakes').authorizationModule);
jest.mock('../utils/threadMessageUtils', () => jest.requireActual('./goldenFakes').threadMessageUtilsModule);
jest.mock('../getPermaLink', () => jest.requireActual('./goldenFakes').getPermaLinkModule);
jest.mock('@rocket.chat/random', () => jest.requireActual('./goldenFakes').randomModule);

const quoted = (...ids: string[]) => ids.map((_id) => ({ _id }) as IMessage);

const original = (extra: object = {}) => ({ _id: 'orig', rid: 'ROOM-O', msg: 'old', ts: NOW, ...extra }) as IMessage;

beforeEach(() => {
	resetFakes();
	resetRandom();
});

describe('composeMessage golden', () => {
	it('builds a plain message with a fresh random id and the data API room', async () => {
		const { composeMessage } = createDataAPI({ rid: 'GENERAL', tmid: undefined });

		const message = await composeMessage('hello', { quotedMessages: [] });

		expect(message).toStrictEqual({ _id: 'random-1', rid: 'GENERAL', msg: 'hello' });
		expect(getCalls()).toEqual([]);
	});

	it('takes a new random id per message', async () => {
		const { composeMessage } = createDataAPI({ rid: 'GENERAL', tmid: undefined });

		const first = await composeMessage('a', { quotedMessages: [] });
		const second = await composeMessage('b', { quotedMessages: [] });

		expect([first._id, second._id]).toEqual(['random-1', 'random-2']);
	});

	it('does not consume a random id when editing', async () => {
		const { composeMessage } = createDataAPI({ rid: 'GENERAL', tmid: undefined });

		await composeMessage('edit', { quotedMessages: [], originalMessage: original() });
		const next = await composeMessage('next', { quotedMessages: [] });

		expect(next._id).toBe('random-1');
	});

	it.each([
		['empty text', '', ''],
		['whitespace is kept as given', '  a  ', '  a  '],
		['unicode', 'café \u{1F600}', 'café \u{1F600}'],
		['newlines', 'a\n\nb', 'a\n\nb'],
	])('keeps %s untouched', async (_name, text, msg) => {
		const { composeMessage } = createDataAPI({ rid: 'GENERAL', tmid: undefined });

		await expect(composeMessage(text, { quotedMessages: [] })).resolves.toStrictEqual({ _id: 'random-1', rid: 'GENERAL', msg });
	});

	describe('threads', () => {
		it('adds tmid for a thread', async () => {
			const { composeMessage } = createDataAPI({ rid: 'GENERAL', tmid: 'thread-1' });

			await expect(composeMessage('hi', { quotedMessages: [] })).resolves.toStrictEqual({
				_id: 'random-1',
				rid: 'GENERAL',
				tmid: 'thread-1',
				msg: 'hi',
			});
		});

		it('adds tshow next to tmid when sending to the channel', async () => {
			const { composeMessage } = createDataAPI({ rid: 'GENERAL', tmid: 'thread-1' });

			await expect(composeMessage('hi', { quotedMessages: [], sendToChannel: true })).resolves.toStrictEqual({
				_id: 'random-1',
				rid: 'GENERAL',
				tmid: 'thread-1',
				tshow: true,
				msg: 'hi',
			});
		});

		it('omits tshow when it is false or absent', async () => {
			const { composeMessage } = createDataAPI({ rid: 'GENERAL', tmid: 'thread-1' });

			await expect(composeMessage('hi', { quotedMessages: [], sendToChannel: false })).resolves.toStrictEqual({
				_id: 'random-1',
				rid: 'GENERAL',
				tmid: 'thread-1',
				msg: 'hi',
			});
		});

		it('drops tshow outside a thread', async () => {
			const { composeMessage } = createDataAPI({ rid: 'GENERAL', tmid: undefined });

			await expect(composeMessage('hi', { quotedMessages: [], sendToChannel: true })).resolves.toStrictEqual({
				_id: 'random-1',
				rid: 'GENERAL',
				msg: 'hi',
			});
		});
	});

	describe('quotes', () => {
		it('prepends one permalink line per quote, in input order, then the text', async () => {
			const { composeMessage } = createDataAPI({ rid: 'GENERAL', tmid: undefined });

			const message = await composeMessage('hello', { quotedMessages: quoted('q1', 'q2', 'q3') });

			expect(message.msg).toBe('[ ](/permalink/q1)\n[ ](/permalink/q2)\n[ ](/permalink/q3)\nhello');
			expect(getCalls()).toEqual([
				['getPermaLink', 'q1'],
				['getPermaLink', 'q2'],
				['getPermaLink', 'q3'],
			]);
		});

		it('uses the permalink of each quote, not their sorted order', async () => {
			const { composeMessage } = createDataAPI({ rid: 'GENERAL', tmid: undefined });
			behavior.permaLinks = { q1: '/one', q2: '/two' };

			const message = await composeMessage('t', { quotedMessages: quoted('q2', 'q1') });

			expect(message.msg).toBe('[ ](/two)\n[ ](/one)\nt');
		});

		it('leaves an empty line before nothing when the text is empty', async () => {
			const { composeMessage } = createDataAPI({ rid: 'GENERAL', tmid: undefined });

			const message = await composeMessage('', { quotedMessages: quoted('q1') });

			expect(message.msg).toBe('[ ](/permalink/q1)\n');
		});

		it('rejects when a permalink cannot be built', async () => {
			const { composeMessage } = createDataAPI({ rid: 'GENERAL', tmid: undefined });
			behavior.permaLinkError = new Error('message-not-found');

			await expect(composeMessage('t', { quotedMessages: quoted('q1') })).rejects.toThrow('message-not-found');
		});
	});

	describe('editing', () => {
		it('keeps the original id and room, ignoring the room of the data API', async () => {
			const { composeMessage } = createDataAPI({ rid: 'GENERAL', tmid: undefined });

			await expect(composeMessage('new', { quotedMessages: [], originalMessage: original() })).resolves.toStrictEqual({
				_id: 'orig',
				rid: 'ROOM-O',
				msg: 'new',
			});
		});

		it('takes the thread of the original, not the one of the data API', async () => {
			const { composeMessage } = createDataAPI({ rid: 'GENERAL', tmid: 'thread-api' });

			await expect(
				composeMessage('new', { quotedMessages: [], originalMessage: original({ tmid: 'thread-o' }), sendToChannel: true }),
			).resolves.toStrictEqual({ _id: 'orig', rid: 'ROOM-O', tmid: 'thread-o', tshow: true, msg: 'new' });
		});

		it('has no thread when the original has none, even if the data API is in a thread', async () => {
			const { composeMessage } = createDataAPI({ rid: 'GENERAL', tmid: 'thread-api' });

			await expect(composeMessage('new', { quotedMessages: [], originalMessage: original(), sendToChannel: true })).resolves.toStrictEqual({
				_id: 'orig',
				rid: 'ROOM-O',
				msg: 'new',
			});
		});

		it('treats a null original as no original', async () => {
			const { composeMessage } = createDataAPI({ rid: 'GENERAL', tmid: undefined });

			await expect(composeMessage('new', { quotedMessages: [], originalMessage: null })).resolves.toStrictEqual({
				_id: 'random-1',
				rid: 'GENERAL',
				msg: 'new',
			});
		});
	});
});

describe('updateMessage golden', () => {
	const post = (params: object) => [['sdk.rest.post', '/v1/chat.update', params]];

	it('posts the plain shape: previewUrls, msgId, roomId, customFields and text', async () => {
		const { updateMessage } = createDataAPI({ rid: 'GENERAL', tmid: undefined });

		await updateMessage({ _id: 'm1', rid: 'GENERAL', msg: 'edited' } as IMessage);

		expect(getCalls()).toStrictEqual(
			post({ previewUrls: undefined, msgId: 'm1', roomId: 'GENERAL', customFields: undefined, text: 'edited' }),
		);
	});

	it('forwards previewUrls and customFields', async () => {
		const { updateMessage } = createDataAPI({ rid: 'GENERAL', tmid: undefined });

		await updateMessage({ _id: 'm1', rid: 'GENERAL', msg: 'edited', customFields: { a: 1 } } as unknown as IMessage, ['https://a.test']);

		expect(getCalls()).toStrictEqual(
			post({ previewUrls: ['https://a.test'], msgId: 'm1', roomId: 'GENERAL', customFields: { a: 1 }, text: 'edited' }),
		);
	});

	it('sends the room of the message, not the one of the data API', async () => {
		const { updateMessage } = createDataAPI({ rid: 'GENERAL', tmid: undefined });

		await updateMessage({ _id: 'm1', rid: 'OTHER', msg: 'edited' } as IMessage);

		expect(getCalls()).toStrictEqual(
			post({ previewUrls: undefined, msgId: 'm1', roomId: 'OTHER', customFields: undefined, text: 'edited' }),
		);
	});

	it('sends an empty text as is', async () => {
		const { updateMessage } = createDataAPI({ rid: 'GENERAL', tmid: undefined });

		await updateMessage({ _id: 'm1', rid: 'GENERAL', msg: '' } as IMessage);

		expect(getCalls()).toStrictEqual(post({ previewUrls: undefined, msgId: 'm1', roomId: 'GENERAL', customFields: undefined, text: '' }));
	});

	it('switches to the encrypted shape for a v2 content: no text, no previewUrls, e2eMentions passed', async () => {
		const { updateMessage } = createDataAPI({ rid: 'GENERAL', tmid: undefined });
		const content = { algorithm: 'rc.v2.aes-sha2', ciphertext: 'abc', iv: 'iv', kid: 'k1' };

		await updateMessage(
			{ _id: 'm1', rid: 'GENERAL', msg: 'ignored', content, e2eMentions: { e2eUserMentions: ['a'] } } as unknown as IMessage,
			['https://ignored.test'],
		);

		expect(getCalls()).toStrictEqual(post({ msgId: 'm1', roomId: 'GENERAL', content, e2eMentions: { e2eUserMentions: ['a'] } }));
	});

	it('switches to the encrypted shape for a v1 content, with e2eMentions undefined when absent', async () => {
		const { updateMessage } = createDataAPI({ rid: 'GENERAL', tmid: undefined });
		const content = { algorithm: 'rc.v1.aes-sha2', ciphertext: 'abc' };

		await updateMessage({ _id: 'm1', rid: 'GENERAL', msg: '', content } as unknown as IMessage);

		expect(getCalls()).toStrictEqual(post({ msgId: 'm1', roomId: 'GENERAL', content, e2eMentions: undefined }));
	});

	it.each([
		['a v2 content without iv', { algorithm: 'rc.v2.aes-sha2', ciphertext: 'abc', kid: 'k' }],
		['a federation algorithm', { algorithm: 'm.megolm.v1.aes-sha2', ciphertext: 'abc' }],
		['a content without ciphertext', { algorithm: 'rc.v1.aes-sha2' }],
	])('stays on the plain shape for %s', async (_name, content) => {
		const { updateMessage } = createDataAPI({ rid: 'GENERAL', tmid: undefined });

		await updateMessage({ _id: 'm1', rid: 'GENERAL', msg: 'edited', content } as unknown as IMessage);

		expect(getCalls()).toStrictEqual(
			post({ previewUrls: undefined, msgId: 'm1', roomId: 'GENERAL', customFields: undefined, text: 'edited' }),
		);
	});

	it('lets the request error reach the caller', async () => {
		const { updateMessage } = createDataAPI({ rid: 'GENERAL', tmid: undefined });
		const failure = new Error('error-message-not-found');
		behavior.post = async () => {
			throw failure;
		};

		await expect(updateMessage({ _id: 'm1', rid: 'GENERAL', msg: 'x' } as IMessage)).rejects.toBe(failure);
	});
});
