import type { VideoConferenceCapabilities } from '@rocket.chat/core-typings';
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

const listeners = new Set<() => void>();

let snapshot: StoredCallPreferences = DEFAULTS;
let snapshotOf: string | null | undefined;

/**
 * The record as it stands, as one object.
 *
 * Read through rather than kept in state, and the same object returned while the stored text is unchanged: every
 * reader has to see the same record, or the last one to write puts its whole copy back and undoes what the
 * others changed. Reading the key is cheap; disagreeing about it is not.
 */
const read = (): StoredCallPreferences => {
	let raw: string | null = null;

	try {
		raw = localStorage.getItem(STORAGE_KEY);
	} catch {
		raw = null;
	}

	if (raw !== snapshotOf) {
		snapshotOf = raw;

		try {
			// Spread over the defaults, because the stored object predates some of these: a user who has arrived at
			// a call before has a record without `ring`, and reading that as "don't ring" would silently stop their
			// calls ringing.
			snapshot = raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Partial<StoredCallPreferences>) } : DEFAULTS;
		} catch {
			snapshot = DEFAULTS;
		}
	}

	return snapshot;
};

const write = (update: (current: StoredCallPreferences) => StoredCallPreferences) => {
	const next = update(read());

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
	} catch {
		// Storage can be refused — a private window, or a browser told to keep nothing. The preference is a
		// convenience, so it is lost rather than made into an error.
	}

	snapshotOf = undefined;
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

/** Everything here reads the record through this, so there is one of it. */
const useStoredCallPreferences = () => [useSyncExternalStore(subscribe, read), write] as const;

/** The ring habit, read out of the shared record. */
const useRingIn = (stored: StoredCallPreferences) => {
	const ring = stored.ring ?? true;
	const toggleRing = useCallback(() => write((current) => ({ ...current, ring: !(current.ring ?? true) })), []);

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
	const [stored] = useStoredCallPreferences();

	return useRingIn(stored);
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
	const [stored] = useStoredCallPreferences();

	const preferences = useMemo(
		(): CallPreferences => ({
			mic: Boolean(capabilities.mic) && stored.mic,
			cam: Boolean(capabilities.cam) && stored.cam,
		}),
		[capabilities.cam, capabilities.mic, stored.cam, stored.mic],
	);

	const toggle = useCallback((device: keyof CallPreferences) => write((current) => ({ ...current, [device]: !current[device] })), []);

	const { ring, toggleRing } = useRingIn(stored);

	return { preferences, ring, toggle, toggleRing };
};
