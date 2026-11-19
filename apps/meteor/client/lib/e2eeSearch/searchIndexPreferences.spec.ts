import { clearLocalStorageKeepingSearchIndexOptIns } from './searchIndexOptIn';
import {
	addSearchIndexRoom,
	DEFAULT_SEARCH_INDEX_PREFERENCES,
	getSearchIndexPreferences,
	parseSearchIndexPreferences,
	removeSearchIndexRoom,
	subscribeToSearchIndexPreferences,
	updateSearchIndexPreferences,
} from './searchIndexPreferences';

const workspace = 'https://chat.example.com/';

describe('searchIndexPreferences', () => {
	beforeEach(() => {
		window.localStorage.clear();
		jest.restoreAllMocks();
	});

	it('gives the defaults, with no room, when nothing is stored or no user is known', () => {
		expect(getSearchIndexPreferences(workspace, 'u1')).toEqual({ ...DEFAULT_SEARCH_INDEX_PREFERENCES, rooms: [] });
		expect(getSearchIndexPreferences(workspace, undefined)).toBe(DEFAULT_SEARCH_INDEX_PREFERENCES);
	});

	it('keeps the rooms and the values of each user and workspace apart', () => {
		addSearchIndexRoom(workspace, 'u1', 'r1');
		updateSearchIndexPreferences(workspace, 'u1', (current) => ({ ...current, pauseSeconds: 3 }));

		expect(getSearchIndexPreferences(workspace, 'u1')).toMatchObject({ rooms: ['r1'], pauseSeconds: 3 });
		expect(getSearchIndexPreferences(workspace, 'u2').rooms).toEqual([]);
		expect(getSearchIndexPreferences('https://other.example.com/', 'u1').rooms).toEqual([]);
	});

	it('adds a room once and removes it', () => {
		addSearchIndexRoom(workspace, 'u1', 'r1');
		addSearchIndexRoom(workspace, 'u1', 'r1');
		addSearchIndexRoom(workspace, 'u1', 'r2');
		expect(getSearchIndexPreferences(workspace, 'u1').rooms).toEqual(['r1', 'r2']);

		removeSearchIndexRoom(workspace, 'u1', 'r1');
		expect(getSearchIndexPreferences(workspace, 'u1').rooms).toEqual(['r2']);
	});

	it('returns the same object until the stored value changes, for useSyncExternalStore', () => {
		const first = getSearchIndexPreferences(workspace, 'u1');
		expect(getSearchIndexPreferences(workspace, 'u1')).toBe(first);

		addSearchIndexRoom(workspace, 'u1', 'r1');
		expect(getSearchIndexPreferences(workspace, 'u1')).not.toBe(first);
	});

	it('gives the default for each invalid field of a damaged value', () => {
		expect(parseSearchIndexPreferences('not json')).toEqual({ ...DEFAULT_SEARCH_INDEX_PREFERENCES, rooms: [] });
		expect(
			parseSearchIndexPreferences(JSON.stringify({ rooms: ['r1', 4, '', 'r1'], pauseSeconds: -1, pageSize: 'big', backfillMonths: 3 })),
		).toEqual({ ...DEFAULT_SEARCH_INDEX_PREFERENCES, rooms: ['r1'], backfillMonths: 3 });
	});

	it('calls the listeners after a change, and reports a change that the local storage did not take', () => {
		const listener = jest.fn();
		const unsubscribe = subscribeToSearchIndexPreferences(listener);

		expect(addSearchIndexRoom(workspace, 'u1', 'r1')).toBe(true);
		jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
			throw new Error('quota');
		});
		expect(addSearchIndexRoom(workspace, 'u1', 'r2')).toBe(false);

		expect(getSearchIndexPreferences(workspace, 'u1').rooms).toEqual(['r1']);
		expect(listener).toHaveBeenCalledTimes(2);
		unsubscribe();
	});

	it('keeps the chosen rooms at logout, so the next open does not remove them from the index', () => {
		addSearchIndexRoom(workspace, 'u1', 'r1');
		window.localStorage.setItem('Meteor.loginToken', 'token');

		clearLocalStorageKeepingSearchIndexOptIns();

		expect(window.localStorage.getItem('Meteor.loginToken')).toBeNull();
		expect(getSearchIndexPreferences(workspace, 'u1').rooms).toEqual(['r1']);
	});
});
