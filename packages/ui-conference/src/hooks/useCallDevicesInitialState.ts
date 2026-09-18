import type { VideoConferenceCapabilities } from '@rocket.chat/core-typings';
import { useUserId } from '@rocket.chat/ui-contexts';
import { useCallback, useMemo, useSyncExternalStore } from 'react';

/** Whether to arrive with mic and camera on. Exactly what the join endpoint accepts, which rejects anything more. */
export type CallPreferences = {
	mic: boolean;
	cam: boolean;
};

/** Whether to ring the people being called. Not part of `CallPreferences`: it is about them, not about arriving. */
export type CallRingPreference = { ring: boolean };

type StoredCallPreferences = CallPreferences & CallRingPreference;

/** Muted and unseen is the safe way in: it can only surprise in the harmless direction. */
const DEFAULTS: StoredCallPreferences = { mic: true, cam: false, ring: true };

const STORAGE_KEY = 'videoconf-call-preferences';

/** Per account, so a shared machine does not hand the next person the last one's camera. */
export const callPreferencesStorageKey = (uid: string | null | undefined) => (uid ? `${STORAGE_KEY}/${uid}` : STORAGE_KEY);

/**
 * The record, with every field it declares checked against the type its default has. What comes out of storage
 * is not ours. Fields this version does not declare are left alone, so a newer version's record survives.
 */
const sanitise = (value: unknown): StoredCallPreferences => {
	if (typeof value !== 'object' || value === null) {
		return DEFAULTS;
	}

	const stored: Record<string, unknown> = { ...value };

	for (const [field, fallback] of Object.entries(DEFAULTS)) {
		if (typeof stored[field] !== typeof fallback) {
			stored[field] = fallback;
		}
	}

	return stored as StoredCallPreferences;
};

const listeners = new Set<() => void>();

/** The last text read from each key, and what it parsed to — so the same object comes back until it changes. */
const snapshots = new Map<string, { raw: string | null; value: StoredCallPreferences }>();

/**
 * The record as it stands. Read through rather than kept in state: every reader has to see the same one, or the
 * last to write puts its whole copy back and undoes what the others changed.
 */
const read = (key: string): StoredCallPreferences => {
	let raw: string | null = null;

	try {
		raw = localStorage.getItem(key);
	} catch {
		raw = null;
	}

	const cached = snapshots.get(key);
	if (cached && cached.raw === raw) {
		return cached.value;
	}

	let value = DEFAULTS;

	try {
		value = raw ? sanitise(JSON.parse(raw)) : DEFAULTS;
	} catch {
		value = DEFAULTS;
	}

	snapshots.set(key, { raw, value });

	return value;
};

const write = (key: string, update: (current: StoredCallPreferences) => StoredCallPreferences) => {
	const next = update(read(key));

	try {
		localStorage.setItem(key, JSON.stringify(next));
	} catch {
		// Storage can be refused. The preference is a convenience, so it is lost rather than made into an error.
	}

	snapshots.delete(key);
	listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
	listeners.add(listener);
	// Another tab writing the same key, which is the one change this window does not make itself.
	window.addEventListener('storage', listener);

	return () => {
		listeners.delete(listener);
		window.removeEventListener('storage', listener);
	};
};

const useStoredCallPreferences = () => {
	const key = callPreferencesStorageKey(useUserId());

	const stored = useSyncExternalStore(
		subscribe,
		useCallback(() => read(key), [key]),
	);
	const setStored = useCallback((update: (current: StoredCallPreferences) => StoredCallPreferences) => write(key, update), [key]);

	return [stored, setStored] as const;
};

const useRingIn = (
	stored: StoredCallPreferences,
	setStored: (update: (current: StoredCallPreferences) => StoredCallPreferences) => void,
) => {
	const { ring } = stored;
	const toggleRing = useCallback(() => setStored((current) => ({ ...current, ring: !current.ring })), [setStored]);

	return { ring, toggleRing };
};

/** Whether to ring the people being called — one habit, the same answer in the preflight and when adding someone. */
export const useCallRingPreference = () => {
	const [stored, setStored] = useStoredCallPreferences();

	return useRingIn(stored, setStored);
};

/**
 * The state a call is about to start in: how this user habitually arrives, narrowed to what the provider can be
 * told about, plus the ring habit. A device the provider knows nothing about is reported off.
 */
export const useCallDevicesInitialState = (capabilities: VideoConferenceCapabilities) => {
	const [stored, setStored] = useStoredCallPreferences();

	const preferences = useMemo(
		(): CallPreferences => ({
			mic: Boolean(capabilities.mic) && stored.mic,
			cam: Boolean(capabilities.cam) && stored.cam,
		}),
		[capabilities.cam, capabilities.mic, stored.cam, stored.mic],
	);

	const toggle = useCallback(
		(device: keyof CallPreferences) => setStored((current) => ({ ...current, [device]: !current[device] })),
		[setStored],
	);

	const { ring, toggleRing } = useRingIn(stored, setStored);

	return { preferences, ring, toggle, toggleRing };
};
