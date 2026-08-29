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

/** Which devices to arrive on. Only a provider running the call in here can be told; the rest never see it. */
export type CallDevices = {
	micId?: string;
	camId?: string;
	speakerId?: string;
};

/** The three things there are to choose. The speaker is output-only, so it has no on/off of its own. */
export type CallDeviceKind = 'mic' | 'cam' | 'speaker';

/** Which way of cleaning up the microphone the user picked. */
export type NoiseMethod = 'none' | 'browser' | 'rnnoise' | 'krisp';

export type CallNoiseSuppressionPreference = { noiseMethod?: NoiseMethod };

/**
 * The most detail to send: `auto` leaves it to the camera and the connection, and the rest are ceilings.
 *
 * `auto` by default, because the cost of asking for more is not only bandwidth: where background blur is done by
 * segmenting every frame, four times the pixels is four times the work per frame, on every call.
 */
export type VideoQuality = 'auto' | 'h1080' | 'h720' | 'h360' | 'h180';

export type CallVideoQualityPreference = { videoQuality: VideoQuality };

/** How much to blur the camera's background: `none`, or one of three strengths. */
export type BlurLevel = 'none' | 'light' | 'medium' | 'strong';

/** Which segmentation model to use: `quality` is sharper around hair but heavier, `performance` is lighter. */
export type BlurModel = 'quality' | 'performance';

export type CallBackgroundBlurPreference = { blurLevel: BlurLevel; blurModel?: BlurModel };

type StoredCallPreferences = CallPreferences &
	CallDevices &
	CallRingPreference &
	CallNoiseSuppressionPreference &
	CallBackgroundBlurPreference &
	CallVideoQualityPreference;

/**
 * Joining muted and unseen is the safe way into a call: it can only be a surprise in the harmless direction.
 *
 * Ringing defaults on, because a call nobody is told about is a call nobody answers — and where ringing would be
 * an interruption rather than an invitation, it is the room type that decides, not this.
 */
const DEFAULTS: StoredCallPreferences = { mic: true, cam: false, ring: true, blurLevel: 'none', videoQuality: 'auto' };

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

type SetStoredCallPreferences = (update: (current: StoredCallPreferences) => StoredCallPreferences) => void;

/**
 * Everything here reads the record through this, so there is one of it per account — and one within the tab.
 *
 * The one record matters as much as the one account: hooks each holding their own copy of it meant none of them
 * heard the others' writes, so a screen that changed a device and then the ring wrote the second change over a
 * record that still carried the first one's old value.
 */
const useStoredCallPreferences = () => {
	const key = callPreferencesStorageKey(useUserId());

	const stored = useSyncExternalStore(
		subscribe,
		useCallback(() => read(key), [key]),
	);
	const setStored: SetStoredCallPreferences = useCallback((update) => write(key, update), [key]);

	return [stored, setStored] as const;
};

/** The ring habit, read out of the shared record. */
const useRingIn = (stored: StoredCallPreferences, setStored: SetStoredCallPreferences) => {
	const { ring } = stored;
	const toggleRing = useCallback(() => setStored((current) => ({ ...current, ring: !current.ring })), [setStored]);

	return { ring, toggleRing };
};

/**
 * Whether to run noise cancelling on the microphone.
 *
 * On by default: a filter that has to be found and switched on is a filter most people never get, and the room it
 * is filtering out is the same room they were in last time. Whoever turns it off — to play an instrument, or
 * because they can hear it working on their own voice — has a reason that will still hold on their next call, so
 * the answer is kept.
 */
export const useNoiseSuppressionPreference = () => {
	const [stored, setStored] = useStoredCallPreferences();

	// Undefined rather than a default: nothing chosen means "the best you can do", which is a better answer than any
	// particular method — and it is what someone who has never opened this menu wants.
	const { noiseMethod } = stored;
	const selectNoiseMethod = useCallback(
		(method: NoiseMethod) => setStored((current) => ({ ...current, noiseMethod: method })),
		[setStored],
	);

	return { noiseMethod, selectNoiseMethod };
};

/** Which resolution to ask the camera for, remembered like the rest of it. */
export const useVideoQualityPreference = () => {
	const [stored, setStored] = useStoredCallPreferences();

	const videoQuality = stored.videoQuality ?? 'auto';
	const selectVideoQuality = useCallback(
		(quality: VideoQuality) => setStored((current) => ({ ...current, videoQuality: quality })),
		[setStored],
	);

	return { videoQuality, selectVideoQuality };
};

/**
 * How much to blur the camera's background, remembered like the rest of it.
 *
 * `none` by default: a blurred background is a deliberate look rather than an improvement everyone wants, and where
 * the camera cannot do it itself we do it by segmenting every frame, which costs real CPU and a download.
 */
export const useBackgroundBlurPreference = () => {
	const [stored, setStored] = useStoredCallPreferences();

	const blurLevel = stored.blurLevel ?? 'none';
	const selectBlurLevel = useCallback((level: BlurLevel) => setStored((current) => ({ ...current, blurLevel: level })), [setStored]);

	const blurModel: BlurModel = stored.blurModel ?? 'quality';
	const selectBlurModel = useCallback((model: BlurModel) => setStored((current) => ({ ...current, blurModel: model })), [setStored]);

	return { blurLevel, selectBlurLevel, blurModel, selectBlurModel };
};

/**
 * How the user wants to arrive in a call — remembered, because it is a habit rather than a per-call decision.
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

	const devices = useMemo(
		(): CallDevices => ({ micId: stored.micId, camId: stored.camId, speakerId: stored.speakerId }),
		[stored.micId, stored.camId, stored.speakerId],
	);

	const toggle = useCallback(
		(device: keyof CallPreferences) => setStored((current) => ({ ...current, [device]: !current[device] })),
		[setStored],
	);

	const { ring, toggleRing } = useRingIn(stored, setStored);

	const selectDevice = useCallback(
		(device: CallDeviceKind, deviceId: string) => setStored((current) => ({ ...current, [`${device}Id`]: deviceId })),
		[setStored],
	);

	return { preferences, devices, ring, toggle, toggleRing, selectDevice };
};
