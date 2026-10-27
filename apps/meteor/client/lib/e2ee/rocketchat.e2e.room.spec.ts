import * as Aes from './crypto/aes';
import { E2ERoom } from './rocketchat.e2e.room';
import { sdk } from '../SDKClient';
import { toSearchDoc } from '../e2eeSearch/toSearchDoc';

jest.mock('./crypto/aes');
jest.mock('../../../client/lib/SDKClient', () => ({
	sdk: { rest: { post: jest.fn() } },
}));
jest.mock('../../../rocketchat.info', () => ({
	Info: { version: '8.7.0' },
}));
// The placeholder of an undecryptable message is a translated string. Without translations, `t` returns ''.
jest.mock('../../../lib/i18n', () => ({
	...jest.requireActual('../../../lib/i18n'),
	t: (key: string) => key,
}));

class FakeResponse {
	constructor(
		private readonly body: unknown,
		public readonly status = 400,
	) {}

	clone() {
		return this;
	}

	async json() {
		return this.body;
	}
}
(global as any).Response = FakeResponse;

const makeRoom = () => new E2ERoom('user-1', { _id: 'room-1', t: 'p', encrypted: true } as any);

describe('E2ERoom.createGroupKey', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		(Aes.generate as jest.Mock).mockResolvedValue('group-key');
		(Aes.exportJwk as jest.Mock).mockResolvedValue({ k: 'jwk' });
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('should discard the local key and not distribute it when it loses the race', async () => {
		(sdk.rest.post as jest.Mock).mockRejectedValueOnce(
			new (global as any).Response({ success: false, errorType: 'error-room-e2e-key-already-exists' }),
		);

		const e2eRoom = makeRoom();
		const result = await e2eRoom.createGroupKey();

		expect(result).toBe(false);
		expect(e2eRoom.groupSessionKey).toBeNull();
		expect(e2eRoom.keyID).toBeUndefined();
		expect(sdk.rest.post).toHaveBeenCalledTimes(1); // only setRoomKeyID was called
		expect(sdk.rest.post).toHaveBeenCalledWith('/v1/e2e.setRoomKeyID', { rid: e2eRoom.roomId, keyID: expect.any(String) });
	});

	it('should return true and distribute the key when it wins the race', async () => {
		(sdk.rest.post as jest.Mock).mockResolvedValue({});
		jest.spyOn(E2ERoom.prototype as any, 'encryptGroupKeyForParticipant').mockResolvedValue('mykey');
		const encryptForOthersSpy = jest.spyOn(E2ERoom.prototype as any, 'encryptKeyForOtherParticipants').mockResolvedValue(undefined);

		const e2eRoom = makeRoom();
		const result = await e2eRoom.createGroupKey();

		expect(result).toBe(true);
		expect(e2eRoom.groupSessionKey).not.toBeNull();

		expect(sdk.rest.post).toHaveBeenCalledWith('/v1/e2e.setRoomKeyID', {
			rid: e2eRoom.roomId,
			keyID: expect.any(String),
		});
		expect(sdk.rest.post).toHaveBeenCalledWith('/v1/e2e.updateGroupKey', {
			rid: e2eRoom.roomId,
			uid: e2eRoom.userId,
			key: 'mykey',
		});

		expect(encryptForOthersSpy).toHaveBeenCalledTimes(1);
		expect(sdk.rest.post).toHaveBeenCalledTimes(2); // both setRoomKeyID and updateGroupKey are called
	});
});

describe('E2ERoom.decryptMessage and the search index', () => {
	// The server stores a file under the SHA-256 hash of its real name.
	const storedFileName = 'a'.repeat(64);

	const encryptedMessage = (overrides: Record<string, unknown> = {}) =>
		({
			_id: 'm1',
			rid: 'room-1',
			t: 'e2e',
			e2e: 'pending',
			msg: '',
			u: { _id: 'user-2', username: 'bob' },
			ts: new Date('2026-10-01T10:00:00.000Z'),
			_updatedAt: new Date('2026-10-01T10:00:00.000Z'),
			content: { algorithm: 'rc.v2.aes-sha2', kid: 'key-1', iv: 'aXY=', ciphertext: 'Y2lwaGVy' },
			...overrides,
		}) as any;

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('gives no search document for a message whose room key is missing', async () => {
		const e2eRoom = makeRoom();

		const decrypted = await e2eRoom.decryptMessage(encryptedMessage());

		expect(toSearchDoc(decrypted as any)).toBeUndefined();
	});

	it('gives no search document for a file message whose room key is missing, and does not index the stored file name', async () => {
		const e2eRoom = makeRoom();

		const decrypted = await e2eRoom.decryptMessage(
			encryptedMessage({
				file: { _id: 'f1', name: storedFileName, type: 'image/png' },
				files: [{ _id: 'f1', name: storedFileName, type: 'image/png' }],
			}),
		);

		expect(toSearchDoc(decrypted as any)).toBeUndefined();
	});

	it('indexes the same message once its room key arrives', async () => {
		const e2eRoom = makeRoom();
		const message = encryptedMessage();
		expect(toSearchDoc((await e2eRoom.decryptMessage(message)) as any)).toBeUndefined();

		e2eRoom.groupSessionKey = { algorithm: { name: 'AES-CTR' }, extractable: false, type: 'secret', usages: ['decrypt'] } as any;
		(Aes.decrypt as jest.Mock).mockResolvedValueOnce(JSON.stringify({ msg: 'hello after the key' }));

		const decrypted = await e2eRoom.decryptMessage(message);

		expect(toSearchDoc(decrypted as any)).toMatchObject({ id: 'm1', body: 'hello after the key', kind: 'text' });
	});
});
