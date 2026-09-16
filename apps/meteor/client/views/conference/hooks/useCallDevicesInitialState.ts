import type { VideoConferenceCapabilities } from '@rocket.chat/core-typings';
import { useLocalStorage } from '@rocket.chat/fuselage-hooks';
import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useMemo } from 'react';

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
 * The ring habit, read out of a record somebody else is already holding.
 *
 * Takes the record rather than reading it, because two `useLocalStorage` hooks on one key are two copies of it:
 * each holds its own state and neither hears the other's writes within the tab, so a screen that toggled a device
 * and then the ring wrote the second change over a record that still had the first one's old value.
 */
const useRingIn = (stored: StoredCallPreferences, setStored: Dispatch<SetStateAction<StoredCallPreferences>>) => {
	// `?? true` because the stored value predates this preference: a user who has arrived at a call before has a
	// stored object without it, and reading that as "don't ring" would silently stop their calls ringing.
	const ring = stored.ring ?? true;
	const toggleRing = useCallback(() => setStored((current) => ({ ...current, ring: !(current.ring ?? true) })), [setStored]);

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
	const [stored, setStored] = useLocalStorage<StoredCallPreferences>(STORAGE_KEY, DEFAULTS);

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
	const [stored, setStored] = useLocalStorage<StoredCallPreferences>(STORAGE_KEY, DEFAULTS);

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

	// From this hook's own copy of the record, not from `useCallRingPreference`: a second `useLocalStorage` on the
	// same key here held a stale copy, so toggling a device and then the ring put the device back as it was.
	const { ring, toggleRing } = useRingIn(stored, setStored);

	return { preferences, ring, toggle, toggleRing };
};
