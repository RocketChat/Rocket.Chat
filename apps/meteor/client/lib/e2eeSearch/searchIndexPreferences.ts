/**
 * The user's choices for the local search of encrypted messages on this device: the rooms to index and how the app
 * indexes their history. They are stored on the device only, in the local storage of the workspace, for each workspace
 * and user, like the index itself. The server never receives them.
 */
export type SearchIndexPreferences = {
	/** The encrypted rooms that the user chose to index. No other room is indexed. */
	rooms: string[];
	/** How far back the app indexes the old messages of a room. 0 indexes only new messages. */
	backfillMonths: number;
	/** The backfill of a room stops after this many messages. 0 sets no limit. */
	maxMessagesPerRoom: number;
	/** Messages per history request. */
	pageSize: number;
	/** The wait between two history requests. */
	pauseSeconds: number;
	/** The first wait after a rate limit or a server error. */
	backoffMinSeconds: number;
	/** The longest wait after rate limits or server errors. */
	backoffMaxSeconds: number;
};

export const DEFAULT_SEARCH_INDEX_PREFERENCES: Readonly<SearchIndexPreferences> = Object.freeze({
	rooms: [],
	backfillMonths: 12,
	maxMessagesPerRoom: 0,
	pageSize: 100,
	pauseSeconds: 12,
	backoffMinSeconds: 10,
	backoffMaxSeconds: 600,
});

export const searchIndexPreferencesKeyPrefix = 'E2EESearch_Prefs_v2_';

const keyOf = (namespace: string, userId: string) => `${searchIndexPreferencesKeyPrefix}${JSON.stringify([namespace, userId])}`;

const numberFields = [
	'backfillMonths',
	'maxMessagesPerRoom',
	'pageSize',
	'pauseSeconds',
	'backoffMinSeconds',
	'backoffMaxSeconds',
] as const satisfies readonly (keyof SearchIndexPreferences)[];

/** Reads stored JSON. A missing or invalid field gives its default, so a damaged value never stops the index. */
export const parseSearchIndexPreferences = (raw: string | null): SearchIndexPreferences => {
	const preferences: SearchIndexPreferences = { ...DEFAULT_SEARCH_INDEX_PREFERENCES, rooms: [] };
	if (!raw) return preferences;
	let value: unknown;
	try {
		value = JSON.parse(raw);
	} catch {
		return preferences;
	}
	if (!value || typeof value !== 'object') return preferences;
	const record = value as Record<string, unknown>;
	if (Array.isArray(record.rooms)) {
		preferences.rooms = [...new Set(record.rooms.filter((rid): rid is string => typeof rid === 'string' && rid.length > 0))];
	}
	for (const field of numberFields) {
		const number = record[field];
		if (typeof number === 'number' && Number.isFinite(number) && number >= 0) preferences[field] = number;
	}
	return preferences;
};

const listeners = new Set<() => void>();
const snapshots = new Map<string, { raw: string | null; value: SearchIndexPreferences }>();

const readRaw = (key: string): string | null => {
	try {
		return window.localStorage.getItem(key);
	} catch {
		return null;
	}
};

/**
 * The preferences of the user for the workspace `namespace`. The same stored value returns the same object, so React can
 * read it with `useSyncExternalStore`.
 */
export const getSearchIndexPreferences = (namespace: string, userId: string | undefined): SearchIndexPreferences => {
	if (!userId) return DEFAULT_SEARCH_INDEX_PREFERENCES;
	const key = keyOf(namespace, userId);
	const raw = readRaw(key);
	const cached = snapshots.get(key);
	if (cached?.raw === raw) return cached.value;
	const value = parseSearchIndexPreferences(raw);
	snapshots.set(key, { raw, value });
	return value;
};

/** Saves a change. Returns `false` when the local storage did not take it: the preferences then stay as they were. */
export const updateSearchIndexPreferences = (
	namespace: string,
	userId: string,
	update: (current: SearchIndexPreferences) => SearchIndexPreferences,
): boolean => {
	const next = update(getSearchIndexPreferences(namespace, userId));
	let saved = true;
	try {
		window.localStorage.setItem(keyOf(namespace, userId), JSON.stringify(next));
	} catch {
		saved = false;
	}
	for (const listener of [...listeners]) listener();
	return saved;
};

export const addSearchIndexRoom = (namespace: string, userId: string, rid: string): boolean =>
	updateSearchIndexPreferences(namespace, userId, (current) =>
		current.rooms.includes(rid) ? current : { ...current, rooms: [...current.rooms, rid] },
	);

export const removeSearchIndexRoom = (namespace: string, userId: string, rid: string): boolean =>
	updateSearchIndexPreferences(namespace, userId, (current) => ({ ...current, rooms: current.rooms.filter((room) => room !== rid) }));

/**
 * Calls the listener each time the preferences change, on this page or in another tab of this workspace. Returns the
 * function that removes it.
 */
export const subscribeToSearchIndexPreferences = (listener: () => void): (() => void) => {
	listeners.add(listener);
	const handleStorage = (event: StorageEvent) => {
		if (event.key === null || event.key.startsWith(searchIndexPreferencesKeyPrefix)) listener();
	};
	window.addEventListener('storage', handleStorage);
	return () => {
		listeners.delete(listener);
		window.removeEventListener('storage', handleStorage);
	};
};
