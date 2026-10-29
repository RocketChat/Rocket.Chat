import {
	clearLocalStorageKeepingSearchIndexOptIns,
	createSearchIndexSyncTimeStore,
	isSearchIndexOptedIn,
	setSearchIndexOptIn,
	subscribeToSearchIndexOptIn,
} from './searchIndexOptIn';

beforeEach(() => {
	window.localStorage.clear();
});

afterEach(() => {
	jest.restoreAllMocks();
});

describe('searchIndexOptIn', () => {
	it('is off by default', () => {
		expect(isSearchIndexOptedIn('u1')).toBe(false);
	});

	it('is off without a user', () => {
		setSearchIndexOptIn('u1', true);

		expect(isSearchIndexOptedIn(undefined)).toBe(false);
	});

	it('keeps the choice for each user on this device', () => {
		setSearchIndexOptIn('u1', true);

		expect(isSearchIndexOptedIn('u1')).toBe(true);
		expect(isSearchIndexOptedIn('u2')).toBe(false);

		setSearchIndexOptIn('u1', false);

		expect(isSearchIndexOptedIn('u1')).toBe(false);
	});

	it('tells the subscribers when the choice changes, and not after they unsubscribe', () => {
		const listener = jest.fn();
		const unsubscribe = subscribeToSearchIndexOptIn(listener);

		setSearchIndexOptIn('u1', true);
		expect(listener).toHaveBeenCalledTimes(1);

		unsubscribe();
		setSearchIndexOptIn('u1', false);
		expect(listener).toHaveBeenCalledTimes(1);
	});

	it('reads off when the local storage throws', () => {
		jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
			throw new Error('blocked');
		});

		expect(isSearchIndexOptedIn('u1')).toBe(false);
	});
	it('tells the subscribers about a choice or a clear of the local storage in another tab, and not about other keys', () => {
		const listener = jest.fn();
		const unsubscribe = subscribeToSearchIndexOptIn(listener);

		window.dispatchEvent(new StorageEvent('storage', { key: 'E2EESearch_OptIn_u1', newValue: null }));
		window.dispatchEvent(new StorageEvent('storage', { key: null }));
		window.dispatchEvent(new StorageEvent('storage', { key: 'Meteor.loginToken' }));
		expect(listener).toHaveBeenCalledTimes(2);

		unsubscribe();
		window.dispatchEvent(new StorageEvent('storage', { key: null }));
		expect(listener).toHaveBeenCalledTimes(2);
	});

	it('reports a choice that the local storage did not take, without throwing, and keeps the old choice', () => {
		setSearchIndexOptIn('u1', true);
		jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
			throw new Error('blocked');
		});
		const listener = jest.fn();
		const unsubscribe = subscribeToSearchIndexOptIn(listener);

		expect(setSearchIndexOptIn('u1', false)).toBe(false);
		expect(isSearchIndexOptedIn('u1')).toBe(true);
		expect(listener).toHaveBeenCalledTimes(1);
		unsubscribe();
	});

	it('removes the other keys at logout without a clear, and never removes a choice that is on', () => {
		setSearchIndexOptIn('u1', true);
		window.localStorage.setItem('Meteor.loginToken', 'token');
		const clear = jest.spyOn(Storage.prototype, 'clear');
		const removeItem = jest.spyOn(Storage.prototype, 'removeItem');

		clearLocalStorageKeepingSearchIndexOptIns();

		expect(clear).not.toHaveBeenCalled();
		expect(removeItem.mock.calls).toEqual([['Meteor.loginToken']]);
		expect(isSearchIndexOptedIn('u1')).toBe(true);
	});

	it('does not throw when the local storage cannot be changed', () => {
		window.localStorage.setItem('Meteor.loginToken', 'token');
		jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
			throw new Error('blocked');
		});

		expect(() => clearLocalStorageKeepingSearchIndexOptIns()).not.toThrow();
	});

	it('clears the local storage when it cannot be read, and does not throw when the clear fails too', () => {
		setSearchIndexOptIn('u1', true);
		jest.spyOn(Storage.prototype, 'key').mockImplementation(() => {
			throw new Error('blocked');
		});

		clearLocalStorageKeepingSearchIndexOptIns();
		expect(isSearchIndexOptedIn('u1')).toBe(false);

		jest.spyOn(Storage.prototype, 'clear').mockImplementation(() => {
			throw new Error('blocked');
		});
		expect(() => clearLocalStorageKeepingSearchIndexOptIns()).not.toThrow();
	});
});

describe('createSearchIndexSyncTimeStore', () => {
	it('keeps the catch-up time of each user, also across the clear of a logout', () => {
		const u1 = createSearchIndexSyncTimeStore('https://chat.example/', () => 'u1');
		const u2 = createSearchIndexSyncTimeStore('https://chat.example/', () => 'u2');
		u1.write(1000);
		window.localStorage.setItem('other', 'x');

		clearLocalStorageKeepingSearchIndexOptIns();

		expect(u1.read()).toBe(1000);
		expect(u2.read()).toBeUndefined();
		expect(window.localStorage.getItem('other')).toBeNull();
	});

	it('keeps the catch-up time of each server apart, also for the same user on servers under the paths of one origin', () => {
		const first = createSearchIndexSyncTimeStore('https://chat.example/a/', () => 'u1');
		const second = createSearchIndexSyncTimeStore('https://chat.example/b/', () => 'u1');
		first.write(1000);

		expect(first.read()).toBe(1000);
		expect(second.read()).toBeUndefined();
	});

	it('reads no time without a user or for a value that is not a time', () => {
		window.localStorage.setItem('E2EESearch_SyncedAt_["https://chat.example/","u1"]', 'garbage');

		expect(createSearchIndexSyncTimeStore('https://chat.example/', () => 'u1').read()).toBeUndefined();
		expect(createSearchIndexSyncTimeStore('https://chat.example/', () => undefined).read()).toBeUndefined();
	});
});
