import * as Aes from './crypto/aes';
import { E2ERoom } from './rocketchat.e2e.room';
import { sdk } from '../SDKClient';

jest.mock('./crypto/aes');
jest.mock('../../../client/lib/SDKClient', () => ({
	sdk: { rest: { post: jest.fn(), get: jest.fn() } },
}));
jest.mock('../../../rocketchat.info', () => ({
	Info: { version: '8.7.0' },
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

describe('E2ERoom.encryptKeyForOtherParticipants', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('should keep handing out the key to the other members when encryption fails for one member', async () => {
		(sdk.rest.get as jest.Mock).mockResolvedValue({
			users: [
				{ _id: 'bad-key', e2e: { public_key: 'not-a-key' } },
				{ _id: 'member-a', e2e: { public_key: 'key-a' } },
				{ _id: 'member-b', e2e: { public_key: 'key-b' } },
			],
		});
		(sdk.rest.post as jest.Mock).mockResolvedValue({});
		jest
			.spyOn(E2ERoom.prototype as any, 'encryptGroupKeyForParticipant')
			.mockImplementation(async (publicKey) => (publicKey === 'not-a-key' ? undefined : `encrypted-for-${publicKey}`));

		await makeRoom().encryptKeyForOtherParticipants();

		expect(sdk.rest.post).toHaveBeenCalledTimes(1);
		expect(sdk.rest.post).toHaveBeenCalledWith('/v1/e2e.provideUsersSuggestedGroupKeys', {
			usersSuggestedGroupKeys: {
				'room-1': [
					{ _id: 'member-a', key: 'encrypted-for-key-a', oldKeys: undefined },
					{ _id: 'member-b', key: 'encrypted-for-key-b', oldKeys: undefined },
				],
			},
		});
	});

	it('should not post when the key could not be encrypted for any member', async () => {
		(sdk.rest.get as jest.Mock).mockResolvedValue({ users: [{ _id: 'bad-key', e2e: { public_key: 'not-a-key' } }] });
		jest.spyOn(E2ERoom.prototype as any, 'encryptGroupKeyForParticipant').mockResolvedValue(undefined);

		await makeRoom().encryptKeyForOtherParticipants();

		expect(sdk.rest.post).not.toHaveBeenCalled();
	});
});
