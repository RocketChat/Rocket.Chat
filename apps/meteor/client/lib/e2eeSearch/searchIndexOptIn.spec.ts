import { isSearchIndexOptedIn, setSearchIndexOptIn, subscribeToSearchIndexOptIn } from './searchIndexOptIn';

beforeEach(() => {
	window.localStorage.clear();
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
});
