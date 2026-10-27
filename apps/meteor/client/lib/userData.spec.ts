import { isSearchIndexOptedIn, setSearchIndexOptIn } from './e2eeSearch/searchIndexOptIn';
import { clearStoredCredentials } from './sdk/ddpSdk';
import { STORAGE_KEYS } from './sdk/storage';
import { removeLocalUserData, synchronizeUserData } from './userData';

type StreamHandler = (data: { type: string; id: string }) => void;

let mockStreamHandler: StreamHandler | undefined;

jest.mock('./SDKClient', () => ({
	sdk: {
		stream: (_name: string, _args: unknown[], handler: StreamHandler) => {
			mockStreamHandler = handler;
			return { stop: jest.fn(), ready: () => Promise.resolve() };
		},
		rest: { get: jest.fn().mockResolvedValue({ success: true }) },
	},
}));

jest.mock('./sdk/ddpSdk', () => ({
	clearStoredCredentials: jest.fn(),
}));

describe('synchronizeUserData', () => {
	beforeEach(() => {
		mockStreamHandler = undefined;
		jest.mocked(clearStoredCredentials).mockClear();
		localStorage.clear();
	});

	it('drops the session when the logged-in user is deleted, so nothing stale is left to log back in with', async () => {
		localStorage.setItem(STORAGE_KEYS.USER_ID, 'uid-1');

		await synchronizeUserData('uid-1');

		expect(mockStreamHandler).toBeDefined();
		mockStreamHandler?.({ type: 'removed', id: 'uid-1' });

		expect(clearStoredCredentials).toHaveBeenCalled();
	});

	it('leaves the session alone when the event belongs to a user that is no longer the one logged in', async () => {
		await synchronizeUserData('uid-1');
		// Another user logged in on this page in the meantime.
		localStorage.setItem(STORAGE_KEYS.USER_ID, 'uid-2');

		expect(mockStreamHandler).toBeDefined();
		mockStreamHandler?.({ type: 'removed', id: 'uid-1' });

		expect(clearStoredCredentials).not.toHaveBeenCalled();
	});
});

describe('removeLocalUserData', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it('clears the local data of the session but keeps the local search choice of each user on this device', () => {
		localStorage.setItem(STORAGE_KEYS.USER_ID, 'uid-1');
		localStorage.setItem('private_key', 'secret');
		setSearchIndexOptIn('uid-1', true);
		setSearchIndexOptIn('uid-2', true);

		removeLocalUserData();

		expect(localStorage.getItem(STORAGE_KEYS.USER_ID)).toBeNull();
		expect(localStorage.getItem('private_key')).toBeNull();
		// The sealed index stays on the device after a logout, so the choice stays with it: without it the next login
		// reads "off" and wipes the index.
		expect(isSearchIndexOptedIn('uid-1')).toBe(true);
		expect(isSearchIndexOptedIn('uid-2')).toBe(true);
	});

	it('does not keep a choice that is off', () => {
		localStorage.setItem('E2EESearch_OptIn_uid-1', 'false');

		removeLocalUserData();

		expect(localStorage.length).toBe(0);
	});
});
