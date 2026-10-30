import {
	clearLocalStorageKeepingSearchIndexOptIns,
	createSearchIndexSyncTimeStore,
	isSearchIndexOptedIn,
	setSearchIndexOptIn,
	subscribeToSearchIndexOptIn,
} from './searchIndexOptIn';

const first = 'https://chat.example/a/';
const second = 'https://chat.example/b/';
const keyOf = (workspace: string, userId: string) => `E2EESearch_OptIn_v2_${JSON.stringify([workspace, userId])}`;

beforeEach(() => window.localStorage.clear());
afterEach(() => jest.restoreAllMocks());

describe('logout retention and catch-up times', () => {
	it('keeps scoped consent and valid times without removing either key', () => {
		setSearchIndexOptIn(first, 'u1', true);
		setSearchIndexOptIn(second, 'u1', true);
		const store = createSearchIndexSyncTimeStore(first, () => 'u1');
		store.write(1234);
		window.localStorage.setItem('Meteor.loginToken', 'secret');
		window.localStorage.setItem('E2EESearch_OptIn_u1', 'true');
		window.localStorage.setItem('E2EESearch_OptIn_v2_bad', 'true');
		window.localStorage.setItem(keyOf(first, 'u2'), 'false');
		const remove = jest.spyOn(Storage.prototype, 'removeItem');
		const clear = jest.spyOn(Storage.prototype, 'clear');
		clearLocalStorageKeepingSearchIndexOptIns();
		expect(isSearchIndexOptedIn(first, 'u1')).toBe(true);
		expect(isSearchIndexOptedIn(second, 'u1')).toBe(true);
		expect(store.read()).toBe(1234);
		expect(window.localStorage.length).toBe(3);
		expect(remove).not.toHaveBeenCalledWith(keyOf(first, 'u1'));
		expect(remove).not.toHaveBeenCalledWith(keyOf(second, 'u1'));
		expect(clear).not.toHaveBeenCalled();
	});

	it('separates catch-up times across workspaces and current users', () => {
		let userId: string | undefined = 'u1';
		const store = createSearchIndexSyncTimeStore('https://CHAT.EXAMPLE:443/a', () => userId);
		store.write(1234);
		expect(createSearchIndexSyncTimeStore(second, () => 'u1').read()).toBeUndefined();
		userId = 'u2';
		expect(store.read()).toBeUndefined();
		store.write(5678);
		userId = 'u1';
		expect(store.read()).toBe(1234);
		userId = undefined;
		store.write(9000);
		expect(store.read()).toBeUndefined();
	});

	it('does not write invalid times or ambiguous workspace identities', () => {
		const store = createSearchIndexSyncTimeStore(first, () => 'u1');
		for (const at of [0, -1, NaN, Infinity]) store.write(at);
		createSearchIndexSyncTimeStore('/a/', () => 'u1').write(1234);
		expect(window.localStorage.length).toBe(0);
		window.localStorage.setItem(`E2EESearch_SyncedAt_v2_${JSON.stringify([first, 'u1'])}`, 'NaN');
		expect(store.read()).toBeUndefined();
		clearLocalStorageKeepingSearchIndexOptIns();
		expect(window.localStorage.length).toBe(0);
	});

	it('uses an unknown catch-up time when storage is unavailable', () => {
		const store = createSearchIndexSyncTimeStore(first, () => 'u1');
		jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
			throw new Error('blocked');
		});
		jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
			throw new Error('blocked');
		});
		expect(store.read()).toBeUndefined();
		expect(() => store.write(1234)).not.toThrow();
	});

	it('continues removing unrelated keys after one removal fails', () => {
		window.localStorage.setItem('first', '1');
		window.localStorage.setItem('second', '2');
		const original = Storage.prototype.removeItem;
		jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(function (this: Storage, key: string) {
			if (key === 'first') throw new Error('blocked');
			original.call(this, key);
		});
		clearLocalStorageKeepingSearchIndexOptIns();
		expect(window.localStorage.getItem('second')).toBeNull();
	});

	it('clears storage conservatively when enumeration fails', () => {
		setSearchIndexOptIn(first, 'u1', true);
		jest.spyOn(Storage.prototype, 'key').mockImplementation(() => {
			throw new Error('blocked');
		});
		clearLocalStorageKeepingSearchIndexOptIns();
		expect(window.localStorage.length).toBe(0);
	});
});

describe('workspace-scoped search consent', () => {
	it('is off without an explicit choice or user', () => {
		expect(isSearchIndexOptedIn(first, 'u1')).toBe(false);
		expect(isSearchIndexOptedIn(first, undefined)).toBe(false);
		expect(setSearchIndexOptIn(first, '', true)).toBe(false);
	});

	it('separates identical user IDs in subpath workspaces on one origin', () => {
		expect(setSearchIndexOptIn(first, 'u1', true)).toBe(true);
		expect(isSearchIndexOptedIn(first, 'u1')).toBe(true);
		expect(isSearchIndexOptedIn(second, 'u1')).toBe(false);
		expect(isSearchIndexOptedIn(first, 'u2')).toBe(false);
	});

	it('normalizes the workspace root without using the current page path', () => {
		setSearchIndexOptIn('https://CHAT.EXAMPLE:443/a', 'u1', true);
		expect(isSearchIndexOptedIn(first, 'u1')).toBe(true);
		expect(isSearchIndexOptedIn('http://chat.example/a/', 'u1')).toBe(false);
		expect(isSearchIndexOptedIn('https://chat.example/a/settings/', 'u1')).toBe(false);
	});

	it('ignores legacy consent with no workspace identity', () => {
		window.localStorage.setItem('E2EESearch_OptIn_u1', 'true');
		expect(isSearchIndexOptedIn(first, 'u1')).toBe(false);
		expect(isSearchIndexOptedIn(second, 'u1')).toBe(false);
		setSearchIndexOptIn(first, 'u1', true);
		expect(isSearchIndexOptedIn(first, 'u1')).toBe(true);
		expect(isSearchIndexOptedIn(second, 'u1')).toBe(false);
	});

	it.each(['', '/a/', 'file:///a/', 'https://user:secret@chat.example/a/', `${first}?workspace=b`, `${first}#b`])(
		'rejects an ambiguous workspace identity: %s',
		(workspace) => {
			expect(setSearchIndexOptIn(workspace, 'u1', true)).toBe(false);
			expect(isSearchIndexOptedIn(workspace, 'u1')).toBe(false);
			expect(window.localStorage.length).toBe(0);
		},
	);

	it('withdraws only the selected workspace consent', () => {
		setSearchIndexOptIn(first, 'u1', true);
		setSearchIndexOptIn(second, 'u1', true);
		setSearchIndexOptIn(first, 'u1', false);
		expect(isSearchIndexOptedIn(first, 'u1')).toBe(false);
		expect(isSearchIndexOptedIn(second, 'u1')).toBe(true);
	});

	it('separates workspace and user strings that contain key delimiters', () => {
		setSearchIndexOptIn(first, 'u1_[]"', true);
		expect(isSearchIndexOptedIn(first, 'u1_[]"')).toBe(true);
		expect(isSearchIndexOptedIn(first, 'u1')).toBe(false);
	});

	it('reports blocked writes and retains the previous choice', () => {
		setSearchIndexOptIn(first, 'u1', true);
		jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
			throw new Error('blocked');
		});
		expect(setSearchIndexOptIn(first, 'u1', false)).toBe(false);
		expect(isSearchIndexOptedIn(first, 'u1')).toBe(true);
	});

	it('reports blocked opt-in writes without enabling consent', () => {
		jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
			throw new Error('blocked');
		});
		expect(setSearchIndexOptIn(first, 'u1', true)).toBe(false);
		expect(isSearchIndexOptedIn(first, 'u1')).toBe(false);
	});

	it('ignores session-storage events and invalid subscriptions', () => {
		const listener = jest.fn();
		const unsubscribeInvalid = subscribeToSearchIndexOptIn('', listener);
		const unsubscribe = subscribeToSearchIndexOptIn(first, listener);
		try {
			window.dispatchEvent(new StorageEvent('storage', { key: keyOf(first, 'u1'), storageArea: window.sessionStorage }));
			expect(listener).not.toHaveBeenCalled();
			unsubscribeInvalid();
		} finally {
			unsubscribe();
		}
	});

	it('is off when storage reads fail', () => {
		jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
			throw new Error('blocked');
		});
		expect(isSearchIndexOptedIn(first, 'u1')).toBe(false);
	});

	it('notifies only local subscribers for the selected workspace', () => {
		const listener = jest.fn();
		const other = jest.fn();
		const unsubscribe = subscribeToSearchIndexOptIn(first, listener);
		const unsubscribeOther = subscribeToSearchIndexOptIn(second, other);
		try {
			setSearchIndexOptIn(first, 'u1', true);
			expect(listener).toHaveBeenCalledTimes(1);
			expect(other).not.toHaveBeenCalled();
			unsubscribe();
			setSearchIndexOptIn(first, 'u1', false);
			expect(listener).toHaveBeenCalledTimes(1);
		} finally {
			unsubscribe();
			unsubscribeOther();
		}
	});

	it('filters cross-tab events and removes the event listener', () => {
		const listener = jest.fn();
		const unsubscribe = subscribeToSearchIndexOptIn(first, listener);
		try {
			for (const key of [keyOf(second, 'u1'), 'E2EESearch_OptIn_u1', 'E2EESearch_OptIn_v2_bad', 'Meteor.loginToken']) {
				window.dispatchEvent(new StorageEvent('storage', { key }));
			}
			expect(listener).not.toHaveBeenCalled();
			window.dispatchEvent(new StorageEvent('storage', { key: keyOf(first, 'u1') }));
			window.dispatchEvent(new StorageEvent('storage', { key: null }));
			expect(listener).toHaveBeenCalledTimes(2);
			unsubscribe();
			window.dispatchEvent(new StorageEvent('storage', { key: null }));
			expect(listener).toHaveBeenCalledTimes(2);
		} finally {
			unsubscribe();
		}
	});
});
