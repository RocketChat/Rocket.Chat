import * as Rsa from './crypto/rsa';
import { Keychain } from './keychain';
import { e2e } from './rocketchat.e2e';
import { Rooms, Subscriptions } from '../../stores';
import { sdk } from '../SDKClient';
import { STORAGE_KEYS, getStoredItem, setStoredItem } from '../sdk/storage';

jest.mock('@rocket.chat/ui-client', () => ({
	imperativeModal: {
		open: jest.fn(),
		close: jest.fn(),
	},
}));

jest.mock('./rocketchat.e2e.room', () => ({}));
jest.mock('../../stores', () => ({
	Rooms: { state: { get: jest.fn(), filter: jest.fn(() => []) }, use: { subscribe: jest.fn(() => jest.fn()) } },
	Subscriptions: { state: { filter: jest.fn(() => []) }, use: { subscribe: jest.fn(() => jest.fn()) } },
}));
jest.mock('../settings', () => ({ settings: { peek: jest.fn() } }));
jest.mock('../../views/e2e/EnterE2EPasswordModal', () => ({}));
jest.mock('../../views/e2e/SaveE2EPasswordModal', () => ({}));
jest.mock('../sdk/ddpSdk', () => ({ getDdpSdk: () => ({ account: { onLogout: jest.fn() } }) }));

jest.mock('../../../client/lib/getUserAvatarURL', () => ({
	getUserAvatarURL: jest.fn(),
}));

jest.mock('../../../lib/i18n', () => ({
	t: (key: string) => key,
}));

jest.mock('../toast', () => ({
	dispatchToastMessage: jest.fn(),
}));

jest.mock('../banners', () => ({
	closeById: jest.fn(),
	open: jest.fn(),
}));

jest.mock('../SDKClient', () => ({
	sdk: { rest: { get: jest.fn(), post: jest.fn() } },
}));

jest.mock('./crypto/rsa', () => ({
	importPrivateKey: jest.fn(async (jwk: { owner: string }) => ({ owner: jwk.owner })),
	generate: jest.fn(async () => ({ publicKey: {}, privateKey: { owner: 'user-a' } })),
	exportPublicKey: jest.fn(async () => JSON.parse(publicKeyOf('user-a'))),
	exportPrivateKey: jest.fn(async () => JSON.parse(privateKeyOf('user-a'))),
}));

// startClient runs only in a secure context (HTTPS), which jsdom does not report.
Object.defineProperty(globalThis, 'isSecureContext', { value: true, configurable: true });

// The private key of each user, as the server stores it (encrypted with the user's E2EE password) and as the client
// stores it in localStorage after a decrypt.
const publicKeyOf = (userId: string) => JSON.stringify({ owner: userId, kind: 'public' });
const privateKeyOf = (userId: string) => JSON.stringify({ owner: userId, kind: 'private' });
const encryptedPrivateKeyOf = (userId: string) => `encrypted-private-key-of-${userId}`;

const serverKeysOf = (userId: string) => ({ public_key: publicKeyOf(userId), private_key: encryptedPrivateKeyOf(userId) });

const deferred = <T>() => {
	let resolve!: (value: T) => void;
	let reject!: (error: unknown) => void;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
};

const untilCalled = async (mock: Pick<jest.Mock, 'mock'>) => {
	for (let i = 0; i < 50 && mock.mock.calls.length === 0; i++) {
		await new Promise((resolve) => setTimeout(resolve, 0));
	}
	expect(mock).toHaveBeenCalled();
};

const loadedKeyOwner = () => (e2e.privateKey as unknown as { owner: string } | undefined)?.owner;

describe('E2E client on a user switch with no logout', () => {
	let loggedInUser: string;

	beforeEach(async () => {
		jest.spyOn(e2e, 'onE2EEReady').mockResolvedValue(undefined);
		jest
			.spyOn(e2e, 'decodePrivateKey')
			.mockImplementation(async (encrypted: string) => privateKeyOf(encrypted.replace('encrypted-private-key-of-', '')));
		(sdk.rest.get as jest.Mock).mockImplementation(async () => serverKeysOf(loggedInUser));

		await e2e.stopClient();
		window.localStorage.clear();

		// User A logged in on this browser before, so the client stored A's decrypted keys.
		loggedInUser = 'user-a';
		setStoredItem(STORAGE_KEYS.E2EE_PUBLIC_KEY, publicKeyOf('user-a'));
		setStoredItem(STORAGE_KEYS.E2EE_PRIVATE_KEY, privateKeyOf('user-a'));
	});

	afterEach(async () => {
		await e2e.stopClient();
		jest.restoreAllMocks();
		jest.clearAllMocks();
	});

	it('starts the second user with the private key of the second user, not the stored key of the first', async () => {
		await e2e.startClient('user-a');
		expect(e2e.getState()).toBe('READY');
		expect(loadedKeyOwner()).toBe('user-a');

		loggedInUser = 'user-b';
		await e2e.startClient('user-b');

		expect(e2e.decodePrivateKey).toHaveBeenCalledWith(encryptedPrivateKeyOf('user-b'));
		expect(Rsa.importPrivateKey).toHaveBeenLastCalledWith(JSON.parse(privateKeyOf('user-b')));
		expect(loadedKeyOwner()).toBe('user-b');
		expect(e2e.publicKey).toBe(publicKeyOf('user-b'));
		expect(getStoredItem(STORAGE_KEYS.E2EE_PRIVATE_KEY)).toBe(privateKeyOf('user-b'));
		expect(e2e.getState()).toBe('READY');
	});

	it('drops the room clients of the first user', async () => {
		await e2e.startClient('user-a');
		(e2e as unknown as { instancesByRoomId: Record<string, unknown> }).instancesByRoomId = { room1: { owner: 'user-a' } };

		loggedInUser = 'user-b';
		await e2e.startClient('user-b');

		expect((e2e as unknown as { instancesByRoomId: Record<string, unknown> }).instancesByRoomId).toEqual({});
	});

	it('does not show the saved E2EE password of the first user to the second user', async () => {
		await e2e.startClient('user-a');
		setStoredItem(STORAGE_KEYS.E2EE_RANDOM_PASSWORD, 'password of user a');

		loggedInUser = 'user-b';
		await e2e.startClient('user-b');

		expect(getStoredItem(STORAGE_KEYS.E2EE_RANDOM_PASSWORD)).toBeNull();
		expect(e2e.getState()).toBe('READY');
	});

	it('keeps the keys of the second user when the start of the first user finishes after the switch', async () => {
		const keysOfUserA = deferred<ReturnType<typeof serverKeysOf>>();
		(sdk.rest.get as jest.Mock).mockImplementationOnce(() => keysOfUserA.promise);

		const startOfUserA = e2e.startClient('user-a');

		loggedInUser = 'user-b';
		await e2e.startClient('user-b');
		keysOfUserA.resolve(serverKeysOf('user-a'));
		await startOfUserA;

		expect(loadedKeyOwner()).toBe('user-b');
		expect(getStoredItem(STORAGE_KEYS.E2EE_PRIVATE_KEY)).toBe(privateKeyOf('user-b'));
		expect(e2e.getState()).toBe('READY');
	});

	it('removes every E2EE item that it stored on logout, also the saved E2EE password', async () => {
		await e2e.startClient('user-a');
		setStoredItem(STORAGE_KEYS.E2EE_RANDOM_PASSWORD, 'password of user a');

		await e2e.stopClient();

		expect(getStoredItem(STORAGE_KEYS.E2EE_PUBLIC_KEY)).toBeNull();
		expect(getStoredItem(STORAGE_KEYS.E2EE_PRIVATE_KEY)).toBeNull();
		expect(getStoredItem(STORAGE_KEYS.E2EE_RANDOM_PASSWORD)).toBeNull();
	});

	it('keeps the second user ready when the key request of the first user fails after the switch', async () => {
		const keysOfUserA = deferred<ReturnType<typeof serverKeysOf>>();
		(sdk.rest.get as jest.Mock).mockImplementationOnce(() => keysOfUserA.promise);

		const startOfUserA = e2e.startClient('user-a');

		loggedInUser = 'user-b';
		await e2e.startClient('user-b');
		keysOfUserA.reject(new Error('network error'));

		await expect(startOfUserA).resolves.toBeUndefined();
		expect(loadedKeyOwner()).toBe('user-b');
		expect(e2e.getState()).toBe('READY');
	});

	it('gives the session to the newest start when a second start begins while the first one stops the previous user', async () => {
		await e2e.startClient('user-a');

		loggedInUser = 'user-c';
		const startOfUserB = e2e.startClient('user-b');
		const startOfUserC = e2e.startClient('user-c');
		await Promise.all([startOfUserB, startOfUserC]);

		expect(e2e.getUserId()).toBe('user-c');
		expect(loadedKeyOwner()).toBe('user-c');
		expect(e2e.getState()).toBe('READY');
	});

	it('keeps the keys of the second user when the key import of the first user ends after the switch', async () => {
		const importOfUserA = deferred<{ owner: string }>();
		(Rsa.importPrivateKey as jest.Mock).mockImplementationOnce(() => importOfUserA.promise);

		const startOfUserA = e2e.startClient('user-a');
		await untilCalled(Rsa.importPrivateKey as jest.Mock);

		loggedInUser = 'user-b';
		await e2e.startClient('user-b');
		importOfUserA.resolve({ owner: 'user-a' });
		await startOfUserA;

		expect(loadedKeyOwner()).toBe('user-b');
		expect(getStoredItem(STORAGE_KEYS.E2EE_PRIVATE_KEY)).toBe(privateKeyOf('user-b'));
		expect(e2e.getState()).toBe('READY');
	});

	it('stores no key when the key import of a start ends after a logout', async () => {
		const importOfUserA = deferred<{ owner: string }>();
		(Rsa.importPrivateKey as jest.Mock).mockImplementationOnce(() => importOfUserA.promise);

		const startOfUserA = e2e.startClient('user-a');
		await untilCalled(Rsa.importPrivateKey as jest.Mock);

		await e2e.stopClient();
		importOfUserA.resolve({ owner: 'user-a' });
		await startOfUserA;

		expect(e2e.privateKey).toBeUndefined();
		expect(getStoredItem(STORAGE_KEYS.E2EE_PUBLIC_KEY)).toBeNull();
		expect(getStoredItem(STORAGE_KEYS.E2EE_PRIVATE_KEY)).toBeNull();
		expect(e2e.getState()).toBe('DISABLED');
	});

	it('does not upload the first user keys when encryption ends after a user switch', async () => {
		const encryption = deferred<Awaited<ReturnType<Keychain['encryptKey']>>>();
		const encryptKey = jest.spyOn(Keychain.prototype, 'encryptKey').mockReturnValueOnce(encryption.promise);
		jest.spyOn(e2e, 'createRandomPassword').mockResolvedValueOnce('password-a');
		(sdk.rest.get as jest.Mock).mockResolvedValueOnce({});

		const startOfUserA = e2e.startClient('user-a');
		await untilCalled(encryptKey);
		expect(encryptKey).toHaveBeenCalledWith(privateKeyOf('user-a'), 'password-a');

		loggedInUser = 'user-b';
		await e2e.startClient('user-b');
		encryption.resolve({ iv: 'iv-a', ciphertext: 'ciphertext-a', salt: 'salt-a', iterations: 100_000 });
		await startOfUserA;

		expect(sdk.rest.post).not.toHaveBeenCalledWith('/v1/e2e.setUserPublicAndPrivateKeys', expect.anything());
		expect(loadedKeyOwner()).toBe('user-b');
		expect(e2e.getState()).toBe('READY');
	});

	it('uploads the current user keys after encryption', async () => {
		const encoded = { iv: 'iv-a', ciphertext: 'ciphertext-a', salt: 'salt-a', iterations: 100_000 };
		jest.spyOn(Keychain.prototype, 'encryptKey').mockResolvedValueOnce(encoded);
		jest.spyOn(e2e, 'createRandomPassword').mockResolvedValueOnce('password-a');
		(sdk.rest.get as jest.Mock).mockResolvedValueOnce({});

		await e2e.startClient('user-a');

		expect(sdk.rest.post).toHaveBeenCalledWith('/v1/e2e.setUserPublicAndPrivateKeys', {
			public_key: publicKeyOf('user-a'),
			private_key: JSON.stringify(encoded),
			force: false,
		});
	});

	it('does not upload a password change after the user switches during encryption', async () => {
		await e2e.startClient('user-a');
		const encryption = deferred<Awaited<ReturnType<Keychain['encryptKey']>>>();
		const encryptKey = jest.spyOn(Keychain.prototype, 'encryptKey').mockReturnValueOnce(encryption.promise);
		const changingPassword = e2e.changePassword('new-password-a');
		await untilCalled(encryptKey);

		loggedInUser = 'user-b';
		await e2e.startClient('user-b');
		setStoredItem(STORAGE_KEYS.E2EE_RANDOM_PASSWORD, 'password-b');
		encryption.resolve({ iv: 'iv-a', ciphertext: 'ciphertext-a', salt: 'salt-a', iterations: 100_000 });
		await changingPassword;

		expect(sdk.rest.post).not.toHaveBeenCalledWith('/v1/e2e.setUserPublicAndPrivateKeys', expect.anything());
		expect(getStoredItem(STORAGE_KEYS.E2EE_RANDOM_PASSWORD)).toBe('password-b');
	});

	it('keeps the second user password when the first user password request finishes after the switch', async () => {
		await e2e.startClient('user-a');
		jest.spyOn(Keychain.prototype, 'encryptKey').mockResolvedValueOnce({
			iv: 'iv-a',
			ciphertext: 'ciphertext-a',
			salt: 'salt-a',
			iterations: 100_000,
		});
		const response = deferred<void>();
		(sdk.rest.post as jest.Mock).mockReturnValueOnce(response.promise);
		const changingPassword = e2e.changePassword('new-password-a');
		await untilCalled(sdk.rest.post as jest.Mock);

		loggedInUser = 'user-b';
		await e2e.startClient('user-b');
		setStoredItem(STORAGE_KEYS.E2EE_RANDOM_PASSWORD, 'password-b');
		response.resolve();
		await changingPassword;

		expect(getStoredItem(STORAGE_KEYS.E2EE_RANDOM_PASSWORD)).toBe('password-b');
	});

	it('stops real ready work paused during distribution without a stale observer, timer, or POST', async () => {
		await e2e.startClient('user-a');
		(e2e.onE2EEReady as jest.Mock).mockRestore();
		jest.useFakeTimers();
		const response = deferred<{ usersWaitingForE2EKeys: Record<string, { _id: string; public_key: string }[]> }>();
		(sdk.rest.get as jest.Mock).mockClear().mockReturnValue(response.promise);
		jest.spyOn(Rooms.state, 'filter').mockReturnValue([{ _id: 'room', usersWaitingForE2EKeys: [{ userId: 'other' }] }] as never);
		jest.spyOn(e2e, 'getInstanceByRoomId').mockResolvedValue({ hasSessionKey: () => true } as never);
		const observing = jest.spyOn(e2e, 'observeSubscriptions');
		const ready = e2e.onE2EEReady();
		for (let i = 0; i < 20; i++) await Promise.resolve();
		expect(sdk.rest.get).toHaveBeenCalledWith('/v1/e2e.fetchUsersWaitingForGroupKey', { roomIds: ['room'] });
		await jest.advanceTimersByTimeAsync(30_000);
		expect(sdk.rest.get).toHaveBeenCalledTimes(1);

		await e2e.stopClient();
		response.resolve({ usersWaitingForE2EKeys: { room: [{ _id: 'other', public_key: 'public' }] } });
		await ready;

		expect(sdk.rest.post).not.toHaveBeenCalled();
		expect(observing).not.toHaveBeenCalled();
		expect(jest.getTimerCount()).toBe(0);
		jest.useRealTimers();
	});

	it('stops real suggested-key processing before an old session accepts a key', async () => {
		await e2e.startClient('user-a');
		(e2e.onE2EEReady as jest.Mock).mockRestore();
		const importing = deferred<boolean>();
		const room = { importGroupKey: jest.fn(() => importing.promise), keyReceived: jest.fn(), resume: jest.fn() };
		jest.spyOn(Subscriptions.state, 'filter').mockReturnValue([{ rid: 'room', E2ESuggestedKey: 'suggestion', encrypted: true }] as never);
		jest.spyOn(e2e, 'getInstanceByRoomId').mockResolvedValue(room as never);
		const observing = jest.spyOn(e2e, 'observeSubscriptions');
		const distributing = jest.spyOn(e2e, 'initiateKeyDistribution');
		const ready = e2e.onE2EEReady();
		await untilCalled(room.importGroupKey);

		await e2e.stopClient();
		importing.resolve(true);
		await ready;

		expect(sdk.rest.post).not.toHaveBeenCalled();
		expect(room.keyReceived).not.toHaveBeenCalled();
		expect(room.resume).not.toHaveBeenCalled();
		expect(distributing).not.toHaveBeenCalled();
		expect(observing).not.toHaveBeenCalled();
	});

	it('cancels room publication waits when the session stops', async () => {
		await e2e.startClient('user-a');
		const unsubscribe = jest.fn();
		(Rooms.use.subscribe as jest.Mock).mockReturnValueOnce(unsubscribe);
		(Rooms.state.get as jest.Mock).mockReturnValue(undefined);
		const room = e2e.getInstanceByRoomId('missing');

		await e2e.stopClient();

		await expect(room).resolves.toBeNull();
		expect(unsubscribe).toHaveBeenCalledTimes(1);
	});

	it.each(['success', 'failure'])('ignores deferred private-key decode %s after a user switch', async (outcome) => {
		window.localStorage.clear();
		const decoding = deferred<string>();
		(e2e.decodePrivateKey as jest.Mock).mockImplementationOnce(() => decoding.promise);
		const starting = e2e.startClient('user-a');
		await untilCalled(e2e.decodePrivateKey as jest.Mock);

		loggedInUser = 'user-b';
		await e2e.startClient('user-b');
		const alert = jest.spyOn(e2e, 'openAlert');
		if (outcome === 'success') decoding.resolve(privateKeyOf('user-a'));
		else decoding.reject(new Error('wrong password'));
		await starting;

		expect(loadedKeyOwner()).toBe('user-b');
		expect(getStoredItem(STORAGE_KEYS.E2EE_PRIVATE_KEY)).toBe(privateKeyOf('user-b'));
		expect(e2e.getState()).toBe('READY');
		expect(alert).not.toHaveBeenCalled();
	});

	it('does not stop the client when the same user starts it again', async () => {
		await e2e.startClient('user-a');
		const stopClient = jest.spyOn(e2e, 'stopClient');

		await e2e.startClient('user-a');

		expect(stopClient).not.toHaveBeenCalled();
		expect(loadedKeyOwner()).toBe('user-a');
	});
});
