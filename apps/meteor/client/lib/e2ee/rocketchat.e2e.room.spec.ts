import * as Aes from './crypto/aes';
import { E2ERoom } from './rocketchat.e2e.room';
import { sdk } from '../../../app/utils/client/lib/SDKClient';

jest.mock('./crypto/aes');
jest.mock('../../../app/utils/client/lib/SDKClient', () => ({
	sdk: { rest: { post: jest.fn() } },
}));
jest.mock('../../../app/utils/client/index', () => ({
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
