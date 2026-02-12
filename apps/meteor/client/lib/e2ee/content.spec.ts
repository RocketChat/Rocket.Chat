import { decodeEncryptedContent } from './content';
import { importKey, decrypt, type Key } from './crypto/aes';

describe('content', () => {
	const msgv1web = Object.freeze({
		_id: 'JfAxN6Ncsw2XS9eiY',
		rid: '68dad82a10815056615446aa',
		e2eMentions: {
			e2eUserMentions: [],
			e2eChannelMentions: [],
		},
		content: Object.freeze({
			algorithm: 'rc.v1.aes-sha2',
			ciphertext: '32c9e7917b78LHjHfqLMeDn+2UK1PhD/soFe8CVwvFdLkslcfxNHby4=',
		}),
		t: 'e2e',
		ts: {
			$date: '2025-09-29T19:07:07.908Z',
		},
		u: {
			_id: 'bm4cAAcN92jgXe2jN',
			username: 'alice',
			name: 'alice',
		},
		msg: '',
		_updatedAt: {
			$date: '2025-09-29T19:07:07.929Z',
		},
		urls: [],
		mentions: [],
		channels: [],
	});

	const msgv1mob = Object.freeze({
		_id: 'AZF8Myj605B3f7ZPL',
		rid: '68dad82a10815056615446aa',
		msg: '32c9e7917b783JpM8aOVludqIRzx+DOqjEU9Mj3NUWb+/GLRl7sdkvTtCMChH1LBjMjJJvVJ6Rlw4dI8BYFftZWiCOiR7TPwriCoSPiZ7dY5C4H2q8MVSdR95ZiyG7eWQ5j5/rxzAYsSWDA9LkumW8JBb+WQ1hD9JMfQd4IXtlFMnaDgEhZhe/s=',
		t: 'e2e',
		e2e: 'pending',
		e2eMentions: {
			e2eUserMentions: [],
			e2eChannelMentions: [],
		},
		content: Object.freeze({
			algorithm: 'rc.v1.aes-sha2',
			ciphertext:
				'32c9e7917b783JpM8aOVludqIRzx+DOqjEU9Mj3NUWb+/GLRl7sdkvTtCMChH1LBjMjJJvVJ6Rlw4dI8BYFftZWiCOiR7TPwriCoSPiZ7dY5C4H2q8MVSdR95ZiyG7eWQ5j5/rxzAYsSWDA9LkumW8JBb+WQ1hD9JMfQd4IXtlFMnaDgEhZhe/s=',
		}),
		ts: {
			$date: '2025-09-29T19:28:35.261Z',
		},
		u: {
			_id: 'RQTYT5RJoDKZFwDhk',
			username: 'bob',
			name: 'bob',
		},
		_updatedAt: {
			$date: '2025-09-29T19:28:35.274Z',
		},
		urls: [],
		mentions: [],
		channels: [],
	});

	describe('v1 messages', () => {
		let key: Key<{ name: 'AES-CBC'; length: 128 }>;

		beforeAll(async () => {
			key = await importKey({
				alg: 'A128CBC',
				ext: true,
				k: 'qb8In0Rpa9nwSusvxxDcbQ',
				key_ops: ['encrypt', 'decrypt'],
				kty: 'oct',
			});
		});

		test('parse v1 web message', async () => {
			const parsed = decodeEncryptedContent(msgv1web.content);
			const decrypted = await decrypt(key, parsed);
			expect(decrypted).toMatchInlineSnapshot(`"{"msg":"hello"}"`);
		});

		test('parse v1 mobile message', async () => {
			const parsed = decodeEncryptedContent(msgv1mob.content);
			const decrypted = await decrypt(key, parsed);
			expect(decrypted).toMatchInlineSnapshot(
				`"{"_id":"AZF8Myj605B3f7ZPL","text":"world","userId":"RQTYT5RJoDKZFwDhk","ts":{"$date":1759174115076}}"`,
			);
		});

		test('parse v1 mobile message from msg field', async () => {
			const parsed = decodeEncryptedContent(msgv1mob.msg);
			const decrypted = await decrypt(key, parsed);
			expect(decrypted).toMatchInlineSnapshot(
				`"{"_id":"AZF8Myj605B3f7ZPL","text":"world","userId":"RQTYT5RJoDKZFwDhk","ts":{"$date":1759174115076}}"`,
			);
		});
	});

	const msgv2web = Object.freeze({
		_id: 'h6sXWTiKcWfcgkhgo',
		rid: '68c9da1b0427bc33b429207e',
		e2eMentions: {
			e2eUserMentions: [],
			e2eChannelMentions: [],
		},
		content: Object.freeze({
			algorithm: 'rc.v2.aes-sha2',
			kid: 'f46d2864-0384-4a87-8815-51fba2cad216',
			iv: 'wXbYQ8q9sYRCHtNp',
			ciphertext: 'cIDO9mXzCCrrl/wORP0Jf6oWeusqzSCXVGGvY7CHrA==',
		}),
		t: 'e2e',
		ts: {
			$date: '2025-09-30T18:05:30.876Z',
		},
		u: {
			_id: 'Ctk47kkuzJihnmvZE',
			username: 'alice',
			name: 'Alice',
		},
		msg: '',
		_updatedAt: {
			$date: '2025-09-30T18:05:30.887Z',
		},
		urls: [],
		mentions: [],
		channels: [],
	});

	test('parse v2 web message', async () => {
		const parsed = decodeEncryptedContent(msgv2web.content);
		const key = await importKey({
			alg: 'A256GCM',
			ext: true,
			k: '9o1xoHt4OamRJvnaLna-5akUb5L98S_iWYGGaXPZ1Yg',
			key_ops: ['encrypt', 'decrypt'],
			kty: 'oct',
		});
		const decrypted = await decrypt(key, parsed);
		expect(decrypted).toMatchInlineSnapshot(`"{"msg":"hello"}"`);
	});
});
