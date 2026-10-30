import { createSearchIndexSyncTimeStore, isSearchIndexOptedIn, setSearchIndexOptIn } from './e2eeSearch/searchIndexOptIn';
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

describe('removeLocalUserData', () => {
	it('removes credentials while preserving scoped local-search consent and catch-up time', () => {
		localStorage.clear();
		const workspace = 'https://chat.example/a/';
		setSearchIndexOptIn(workspace, 'uid-1', true);
		const syncTime = createSearchIndexSyncTimeStore(workspace, () => 'uid-1');
		syncTime.write(1234);
		localStorage.setItem(STORAGE_KEYS.USER_ID, 'uid-1');
		localStorage.setItem('Meteor.loginToken', 'secret');
		localStorage.setItem('E2EESearch_OptIn_uid-1', 'true');

		removeLocalUserData();

		expect(localStorage.getItem(STORAGE_KEYS.USER_ID)).toBeNull();
		expect(localStorage.getItem('Meteor.loginToken')).toBeNull();
		expect(localStorage.getItem('E2EESearch_OptIn_uid-1')).toBeNull();
		expect(isSearchIndexOptedIn(workspace, 'uid-1')).toBe(true);
		expect(syncTime.read()).toBe(1234);
	});
});

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
