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
	const promise = new Promise<T>((res) => {
		resolve = res;
	});
	return { promise, resolve };
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

	it('does not stop the client when the same user starts it again', async () => {
		await e2e.startClient('user-a');
		const stopClient = jest.spyOn(e2e, 'stopClient');

		await e2e.startClient('user-a');

		expect(stopClient).not.toHaveBeenCalled();
		expect(loadedKeyOwner()).toBe('user-a');
	});
});
