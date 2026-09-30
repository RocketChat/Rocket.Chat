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

/** Muted and unseen is the safe way in: it can only surprise in the harmless direction. */
const DEFAULTS: StoredCallPreferences = { mic: true, cam: false, ring: true, blurLevel: 'none', videoQuality: 'auto' };

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

type SetStoredCallPreferences = (update: (current: StoredCallPreferences) => StoredCallPreferences) => void;

/**
 * Everything here reads the record through this, so there is one of it per account and one within the tab: two
 * copies would each miss the other's writes, and the second change to land would put the first one's old value back.
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

const useRingIn = (stored: StoredCallPreferences, setStored: SetStoredCallPreferences) => {
	const { ring } = stored;
	const toggleRing = useCallback(() => setStored((current) => ({ ...current, ring: !current.ring })), [setStored]);

	return { ring, toggleRing };
};

/**
 * Whether, and how, to clean up the microphone — remembered, since whoever turns it off (to play an instrument, or
 * because they can hear it working on their voice) has a reason that will still hold on their next call.
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

/** Whether to ring the people being called — one habit, the same answer in the preflight and when adding someone. */
export const useCallRingPreference = () => {
	const [stored, setStored] = useStoredCallPreferences();

	return useRingIn(stored, setStored);
};

/**
 * The state a call is about to start in: how this user habitually arrives and on which devices, narrowed to what
 * the provider can be told about, plus the ring habit. A device the provider knows nothing about is reported off.
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
