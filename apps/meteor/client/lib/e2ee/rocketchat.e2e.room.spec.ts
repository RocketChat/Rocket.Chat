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
		jest.spyOn(E2ERoom.prototype as any, 'encryptGroupKeyForParticipant').mockResolvedValue('mykey');
		const encryptForOthersSpy = jest.spyOn(E2ERoom.prototype as any, 'encryptKeyForOtherParticipants');

		const e2eRoom = makeRoom();
		const result = await e2eRoom.createGroupKey();

		expect(result).toBe(false);
		expect(e2eRoom.groupSessionKey).toBeNull();
		expect(e2eRoom.keyID).toBeUndefined();
		expect(sdk.rest.post).toHaveBeenCalledTimes(1); // only setRoomKeyID was called
		expect(sdk.rest.post).toHaveBeenCalledWith('/v1/e2e.setRoomKeyID', { rid: e2eRoom.roomId, keyID: expect.any(String), key: 'mykey' });
		expect(encryptForOthersSpy).not.toHaveBeenCalled();
	});

	it('should return true and distribute the key when it wins the race', async () => {
		(sdk.rest.post as jest.Mock).mockResolvedValue({});
		jest.spyOn(E2ERoom.prototype as any, 'encryptGroupKeyForParticipant').mockResolvedValue('mykey');
		const encryptForOthersSpy = jest.spyOn(E2ERoom.prototype as any, 'encryptKeyForOtherParticipants').mockResolvedValue(undefined);

		const e2eRoom = makeRoom();
		const result = await e2eRoom.createGroupKey();

		expect(result).toBe(true);
		expect(e2eRoom.groupSessionKey).not.toBeNull();

		// The creator's key goes with the key id, in one request.
		expect(sdk.rest.post).toHaveBeenCalledWith('/v1/e2e.setRoomKeyID', {
			rid: e2eRoom.roomId,
			keyID: e2eRoom.keyID,
			key: 'mykey',
		});

		expect(encryptForOthersSpy).toHaveBeenCalledTimes(1);
		expect(sdk.rest.post).toHaveBeenCalledTimes(1);
	});
});

// The server side of the first key exchange of a new room: the room key id, and the room key of the creator.
const makeFakeServer = () => {
	const server: { e2eKeyId?: string; creatorKey?: string } = {};
	const post = async (path: string, body: { rid: string; keyID?: string; key?: string; uid?: string }) => {
		if (path === '/v1/e2e.setRoomKeyID') {
			if (server.e2eKeyId) {
				throw new (global as any).Response({ success: false, errorType: 'error-room-e2e-key-already-exists' });
			}
			server.e2eKeyId = body.keyID;
			if (body.key) {
				server.creatorKey = body.key;
			}
			return {};
		}
		if (path === '/v1/e2e.updateGroupKey' && body.uid === 'user-1') {
			server.creatorKey = body.key;
		}
		return {};
	};
	return { server, post };
};

describe('E2ERoom.createGroupKey when the page goes away during the first key exchange', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		(Aes.generate as jest.Mock).mockResolvedValue('group-key');
		(Aes.exportJwk as jest.Mock).mockResolvedValue({ k: 'jwk' });
		jest.spyOn(E2ERoom.prototype as any, 'encryptGroupKeyForParticipant').mockResolvedValue('my-room-key');
		jest.spyOn(E2ERoom.prototype as any, 'encryptKeyForOtherParticipants').mockResolvedValue(undefined);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('should not leave a room key id that no member holds when the page unloads after the server accepts the key id', async () => {
		const { server, post } = makeFakeServer();
		// The first page: the server handles setRoomKeyID, then the page unloads before it reads the response.
		(sdk.rest.post as jest.Mock).mockImplementationOnce(async (path, body) => {
			await post(path, body);
			return new Promise(() => undefined);
		});
		void makeRoom().createGroupKey();
		await new Promise((resolve) => setTimeout(resolve, 0));

		// The next page: the room has no key id in its store yet, so it also tries to make the room key.
		(sdk.rest.post as jest.Mock).mockImplementation(post);
		const created = await makeRoom().createGroupKey();

		expect(created).toBe(false);
		expect(server.e2eKeyId).toBeDefined();
		expect(server.creatorKey).toBeDefined();
	});

	it('should not set a room key id when it cannot encrypt the room key for the creator', async () => {
		const { server, post } = makeFakeServer();
		(sdk.rest.post as jest.Mock).mockImplementation(post);
		(E2ERoom.prototype as any).encryptGroupKeyForParticipant.mockResolvedValue(undefined);

		await expect(makeRoom().createGroupKey()).rejects.toThrow();

		expect(server.e2eKeyId).toBeUndefined();
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

		expect(sdk.rest.get).toHaveBeenCalledWith('/v1/e2e.getUsersOfRoomWithoutKey', { rid: 'room-1' });
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

describe('E2ERoom queued participant encryption', () => {
	afterEach(() => {
		jest.restoreAllMocks();
		jest.clearAllMocks();
	});

	it('omits a failed participant and keeps that participant eligible for retry', async () => {
		(e2e.isReady as jest.Mock).mockReturnValue(false);
		const room = makeRoom();
		room.state = 'READY';
		const encrypt = jest.spyOn(room, 'encryptGroupKeyForParticipant').mockResolvedValueOnce(undefined).mockResolvedValue('valid-key');
		const users = [
			{ _id: 'bad', public_key: 'bad-key' },
			{ _id: 'good', public_key: 'good-key' },
		];

		expect(await room.encryptGroupKeyForParticipantsWaitingForTheKeys(users)).toEqual([{ _id: 'good', key: 'valid-key' }]);
		expect(await room.encryptGroupKeyForParticipantsWaitingForTheKeys(users.slice(0, 1))).toEqual([{ _id: 'bad', key: 'valid-key' }]);
		expect(encrypt).toHaveBeenCalledTimes(3);
	});
});
