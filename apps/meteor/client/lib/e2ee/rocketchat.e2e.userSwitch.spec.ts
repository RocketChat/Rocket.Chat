import * as Rsa from './crypto/rsa';
import { e2e } from './rocketchat.e2e';
import { sdk } from '../SDKClient';
import { STORAGE_KEYS, getStoredItem, setStoredItem } from '../sdk/storage';

jest.mock('@rocket.chat/ui-client', () => ({
	imperativeModal: {
		open: jest.fn(),
		close: jest.fn(),
	},
}));

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

const untilCalled = async (mock: jest.Mock) => {
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

	afterEach(() => {
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

	it('removes every E2EE item that it stored on logout, also the saved E2EE password', async () => {
		await e2e.startClient('user-a');
		setStoredItem(STORAGE_KEYS.E2EE_RANDOM_PASSWORD, 'password of user a');

		await e2e.stopClient();

		expect(getStoredItem(STORAGE_KEYS.E2EE_PUBLIC_KEY)).toBeNull();
		expect(getStoredItem(STORAGE_KEYS.E2EE_PRIVATE_KEY)).toBeNull();
		expect(getStoredItem(STORAGE_KEYS.E2EE_RANDOM_PASSWORD)).toBeNull();
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

	it('does not stop the client when the same user starts it again', async () => {
		await e2e.startClient('user-a');
		const stopClient = jest.spyOn(e2e, 'stopClient');

		await e2e.startClient('user-a');

		expect(stopClient).not.toHaveBeenCalled();
		expect(loadedKeyOwner()).toBe('user-a');
	});
});
