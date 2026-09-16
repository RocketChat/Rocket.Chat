import type { VideoConferenceCapabilities } from '@rocket.chat/core-typings';
import { useUserId } from '@rocket.chat/ui-contexts';
import { useCallback, useMemo, useSyncExternalStore } from 'react';

/**
 * Whether to arrive with mic and camera on. This is the part the *server* is told, so it stays exactly what the
 * join endpoint accepts — which device to use is no business of the server's, and the endpoint rejects it.
 */
export type CallPreferences = {
	mic: boolean;
	cam: boolean;
};

/**
 * Whether to ring the people being called, remembered like the rest of it.
 *
 * Separate from `CallPreferences` because it is not about how the caller arrives: it is about what happens to
 * everyone else. It is kept in the same store because it is the same kind of thing — a habit, not a per-call
 * decision — and because the person adding someone to a call has the same question as the person starting one.
 */
export type CallRingPreference = { ring: boolean };

type StoredCallPreferences = CallPreferences & CallRingPreference;

/**
 * Joining muted and unseen is the safe way into a call: it can only be a surprise in the harmless direction.
 *
 * Ringing defaults on, because a call nobody is told about is a call nobody answers — and where ringing would be
 * an interruption rather than an invitation, it is the room type that decides, not this.
 */
const DEFAULTS: StoredCallPreferences = { mic: true, cam: false, ring: true };

const STORAGE_KEY = 'videoconf-call-preferences';

/**
 * Whose habits these are.
 *
 * One key for the browser was one record for whoever sat at it: a shared machine handed the next person the
 * last one's camera. Anonymous viewers keep the bare key, having no account to keep it under.
 */
export const callPreferencesStorageKey = (uid: string | null | undefined) => (uid ? `${STORAGE_KEY}/${uid}` : STORAGE_KEY);

/**
 * The record, with every field it declares checked against the type its default has.
 *
 * What comes back out of storage is not ours: it may have been written by an older version of this, edited by
 * hand, or truncated — and a `mic` that is the string "false" is not a microphone that is off. Fields this
 * version does not declare are left alone, so a record written by a newer one survives a visit from this.
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
 * The record as it stands, as one object.
 *
 * Read through rather than kept in state, and the same object returned while the stored text is unchanged: every
 * reader has to see the same record, or the last one to write puts its whole copy back and undoes what the
 * others changed. Reading the key is cheap; disagreeing about it is not.
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
		// Storage can be refused — a private window, or a browser told to keep nothing. The preference is a
		// convenience, so it is lost rather than made into an error.
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

/** Everything here reads the record through this, so there is one of it per account. */
const useStoredCallPreferences = () => {
	const key = callPreferencesStorageKey(useUserId());

	const stored = useSyncExternalStore(
		subscribe,
		useCallback(() => read(key), [key]),
	);
	const setStored = useCallback((update: (current: StoredCallPreferences) => StoredCallPreferences) => write(key, update), [key]);

	return [stored, setStored] as const;
};

/** The ring habit, read out of the shared record. */
const useRingIn = (
	stored: StoredCallPreferences,
	setStored: (update: (current: StoredCallPreferences) => StoredCallPreferences) => void,
) => {
	const { ring } = stored;
	const toggleRing = useCallback(() => setStored((current) => ({ ...current, ring: !current.ring })), [setStored]);

	return { ring, toggleRing };
};

/**
 * Whether to ring the people being called — the same answer wherever it is asked.
 *
 * Shared by the preflight and by adding someone to a call in progress, because it is one habit rather than two:
 * whoever always rings wants to ring in both places, and whoever never does wants neither.
 *
 * Stored alongside the arrival preferences rather than in a key of its own, so there is one record of "how this
 * user makes calls" instead of several that can disagree — which is also why it lives in this file rather than
 * one of its own: the two hooks read and write the same record.
 */
export const useCallRingPreference = () => {
	const [stored, setStored] = useStoredCallPreferences();

	return useRingIn(stored, setStored);
};

/**
 * The state a call is about to start in: mic and camera as this user habitually arrives, narrowed to what the
 * provider can actually be told about, plus the ring habit the preflight also asks about.
 *
 * Named for what it answers rather than for where it reads from. It is not simply the stored preferences — those
 * are one of its two inputs, the provider's capabilities being the other, and a provider that cannot be told
 * about a device has that device reported as off so nothing claims to have configured something it can't.
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
