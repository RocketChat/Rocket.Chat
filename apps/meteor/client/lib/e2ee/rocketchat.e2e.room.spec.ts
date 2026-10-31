import * as Aes from './crypto/aes';
import { createLogger } from './logger';
import { e2e } from './rocketchat.e2e';
import { E2ERoom } from './rocketchat.e2e.room';
import { Rooms, Subscriptions } from '../../stores';
import { sdk } from '../SDKClient';

jest.mock('./crypto/aes');
jest.mock('./logger', () => {
	const span = { set: jest.fn().mockReturnThis(), info: jest.fn(), warn: jest.fn(), error: jest.fn() };
	return { createLogger: () => ({ span: () => span }) };
});
jest.mock('./rocketchat.e2e', () => ({ e2e: { isReady: jest.fn(), requestSubscriptionKeys: jest.fn() } }));
jest.mock('../rooms/roomCoordinator', () => ({ roomCoordinator: {} }));
jest.mock('../../stores', () => ({
	Messages: {},
	Rooms: { state: { get: jest.fn() } },
	Subscriptions: { state: { find: jest.fn() } },
}));
jest.mock('../../../lib/i18n', () => ({ t: (key: string) => key }));
jest.mock('../../../client/lib/SDKClient', () => ({
	sdk: { rest: { post: jest.fn() } },
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

describe('E2ERoom.handshake', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.spyOn(e2e, 'isReady').mockReturnValue(true);
		jest.spyOn(e2e, 'requestSubscriptionKeys').mockResolvedValue(undefined);
		jest.spyOn(Subscriptions.state, 'find').mockReturnValue(undefined);
		jest.spyOn(Rooms.state, 'get').mockReturnValue({ _id: 'room-1', t: 'p', encrypted: true, e2eKeyId: 'key-1' } as any);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('should ask the server to queue the user when the room has a key that the user does not hold', async () => {
		const requestSpy = jest.spyOn(e2e, 'requestSubscriptionKeys').mockResolvedValue(undefined);

		const e2eRoom = makeRoom();
		await e2eRoom.handshake();

		expect(requestSpy).toHaveBeenCalledTimes(1);
		expect(e2eRoom.getState()).toBe('WAITING_KEYS');
	});

	it('should stay in WAITING_KEYS when the request fails', async () => {
		const error = new Error('network');
		const request = jest.spyOn(e2e, 'requestSubscriptionKeys').mockRejectedValue(error);

		const e2eRoom = makeRoom();
		await e2eRoom.handshake();
		await Promise.resolve();

		expect(request).toHaveBeenCalledTimes(1);
		expect(createLogger('test').span('test').set).toHaveBeenCalledWith('error', error);
		expect(createLogger('test').span('test').error).toHaveBeenCalledWith('Error requesting room key');
		expect(e2eRoom.getState()).toBe('WAITING_KEYS');
	});

	it('requests admission after losing room-key creation', async () => {
		(Rooms.state.get as jest.Mock).mockReturnValue({ _id: 'room-1', t: 'p', encrypted: true });
		jest.spyOn(E2ERoom.prototype, 'createGroupKey').mockResolvedValue(false);

		const room = makeRoom();
		await room.handshake();

		expect(e2e.requestSubscriptionKeys).toHaveBeenCalledTimes(1);
		expect(room.getState()).toBe('WAITING_KEYS');
	});

	it('requests admission for a reset room with no subscription key or suggestion', () => {
		(e2e.isReady as jest.Mock).mockReturnValue(false);
		const room = makeRoom();
		room.state = 'WAITING_KEYS';
		(e2e.isReady as jest.Mock).mockReturnValue(true);
		room.onRoomKeyReset('new-key');

		expect(e2e.requestSubscriptionKeys).toHaveBeenCalledTimes(1);
		expect(room.keyID).toBe('new-key');
		expect(room.getState()).toBe('WAITING_KEYS');
	});

	it('marks admission dirty when a room resets during an existing request', async () => {
		let resolve!: () => void;
		(e2e.requestSubscriptionKeys as jest.Mock).mockReturnValue(
			new Promise<void>((done) => {
				resolve = done;
			}),
		);
		const room = makeRoom();
		await room.handshake();

		room.onRoomKeyReset('new-key');

		expect(e2e.requestSubscriptionKeys).toHaveBeenCalledTimes(2);
		resolve();
		await Promise.resolve();
	});

	it('allows a later handshake to request admission after a failed request', async () => {
		(e2e.requestSubscriptionKeys as jest.Mock).mockRejectedValueOnce(new Error('network')).mockResolvedValue(undefined);
		const room = makeRoom();
		await room.handshake();
		await new Promise((resolve) => setTimeout(resolve, 0));

		await room.handshake();

		expect(e2e.requestSubscriptionKeys).toHaveBeenCalledTimes(2);
		expect(room.getState()).toBe('WAITING_KEYS');
	});
});
