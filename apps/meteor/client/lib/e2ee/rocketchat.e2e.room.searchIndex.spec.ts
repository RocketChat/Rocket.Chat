import type { IMessage, IRoom } from '@rocket.chat/core-typings';

import { decodeEncryptedContent } from './content';
import * as Aes from './crypto/aes';
import { E2ERoom } from './rocketchat.e2e.room';

jest.mock('./content', () => ({ decodeEncryptedContent: jest.fn(() => ({ kid: 'key', iv: 'iv', ciphertext: 'ciphertext' })) }));
jest.mock('./crypto/aes', () => ({ decrypt: jest.fn() }));
jest.mock('./rocketchat.e2e', () => ({ e2e: { isReady: () => false } }));
jest.mock('../../stores', () => ({}));
jest.mock('../SDKClient', () => ({}));
jest.mock('../rooms/roomCoordinator', () => ({ roomCoordinator: {} }));
jest.mock('../settings', () => ({ settings: { peek: jest.fn() } }));
jest.mock('../../../lib/i18n', () => ({ t: (key: string) => key }));

const room = () => new E2ERoom('u', { _id: 'r', t: 'p', encrypted: true } as IRoom);
const message = (modern: boolean): IMessage => ({
	_id: 'm',
	rid: 'r',
	t: 'e2e',
	e2e: 'pending',
	msg: 'ciphertext',
	...(modern && { content: { algorithm: 'rc.v1.aes-sha2', ciphertext: 'ciphertext' } }),
	u: { _id: 'u', username: 'alice' },
	ts: new Date(),
	_updatedAt: new Date(),
});

afterEach(() => {
	jest.restoreAllMocks();
	jest.clearAllMocks();
});

it.each([false, true])('marks missing-key messages for retry (modern=%s)', async (modern) => {
	const instance = room();
	const decrypted = await instance.decryptMessage(message(modern));
	expect(decrypted).toMatchObject({ e2e: 'done', msg: 'E2E_indecipherable', decryptFailed: true });
	expect(Aes.decrypt).not.toHaveBeenCalled();
});

it.each([JSON.stringify({ msg: 'plain', decryptFailed: true }), JSON.stringify({ text: 'legacy', decryptFailed: true })])(
	'ignores a sender-supplied failure marker: %s',
	async (plaintext) => {
		const instance = room();
		instance.groupSessionKey = {
			algorithm: { name: 'AES-GCM', length: 256 },
			extractable: true,
			type: 'secret',
			usages: ['encrypt', 'decrypt'],
		} satisfies NonNullable<E2ERoom['groupSessionKey']>;
		jest.mocked(Aes.decrypt).mockResolvedValue(plaintext);
		const result = await instance.decrypt('ciphertext');
		expect(result).not.toHaveProperty('decryptFailed');
		expect(result.msg).toBe(JSON.parse(plaintext).msg ?? JSON.parse(plaintext).text);
	},
);

it('marks invalid payloads and authentication failures', async () => {
	const instance = room();
	instance.groupSessionKey = {
		algorithm: { name: 'AES-GCM', length: 256 },
		extractable: true,
		type: 'secret',
		usages: ['encrypt', 'decrypt'],
	} satisfies NonNullable<E2ERoom['groupSessionKey']>;
	jest.mocked(Aes.decrypt).mockResolvedValueOnce('null').mockRejectedValueOnce(new Error('authentication failed'));
	await expect(instance.decrypt('ciphertext')).resolves.toMatchObject({ decryptFailed: true });
	await expect(instance.decrypt('ciphertext')).resolves.toMatchObject({ decryptFailed: true, msg: 'E2E_Key_Error' });
	expect(decodeEncryptedContent).toHaveBeenCalledTimes(2);
});

it('exposes the pending old-key load before retry listeners run', async () => {
	const instance = room();
	let finish!: () => void;
	const keys = new Promise<void>((resolve) => {
		finish = resolve;
	});
	jest.spyOn(instance, 'decryptOldRoomKeys').mockReturnValue(keys);
	const pending = jest.spyOn(instance, 'decryptPendingMessages').mockResolvedValue(undefined);
	jest.spyOn(instance, 'decryptSubscription').mockResolvedValue(undefined);
	instance.emit('READY');
	expect(instance.whenOldRoomKeysLoaded()).toBe(keys);
	expect(pending).not.toHaveBeenCalled();
	finish();
	await instance.whenOldRoomKeysLoaded();
	expect(pending).toHaveBeenCalledTimes(1);
});
