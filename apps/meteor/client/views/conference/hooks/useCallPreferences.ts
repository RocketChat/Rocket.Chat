import type { VideoConferenceCapabilities } from '@rocket.chat/core-typings';
import { useLocalStorage } from '@rocket.chat/fuselage-hooks';
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

/**
 * Whether to ring the people being called — the same answer wherever it is asked.
 *
 * Shared by the preflight and by adding someone to a call in progress, because it is one habit rather than two:
 * whoever always rings wants to ring in both places, and whoever never does wants neither.
 *
 * Stored alongside the arrival preferences rather than in a key of its own, so there is one record of "how this
 * user makes calls" instead of several that can disagree.
 */
export const useCallRingPreference = () => {
	const [stored, setStored] = useLocalStorage<StoredCallPreferences>('videoconf-call-preferences', DEFAULTS);

	// `?? true` because the stored value predates this preference: a user who has arrived at a call before has a
	// stored object without it, and reading that as "don't ring" would silently stop their calls ringing.
	const ring = stored.ring ?? true;
	const toggleRing = useCallback(() => setStored((current) => ({ ...current, ring: !(current.ring ?? true) })), [setStored]);

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
	const [stored, setStored] = useLocalStorage<StoredCallPreferences>('videoconf-call-preferences', DEFAULTS);

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
	const [stored, setStored] = useLocalStorage<StoredCallPreferences>('videoconf-call-preferences', DEFAULTS);

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
	const [stored, setStored] = useLocalStorage<StoredCallPreferences>('videoconf-call-preferences', DEFAULTS);

	const blurLevel = stored.blurLevel ?? 'none';
	const selectBlurLevel = useCallback((level: BlurLevel) => setStored((current) => ({ ...current, blurLevel: level })), [setStored]);

	const blurModel: BlurModel = stored.blurModel ?? 'quality';
	const selectBlurModel = useCallback((model: BlurModel) => setStored((current) => ({ ...current, blurModel: model })), [setStored]);

	return { blurLevel, selectBlurLevel, blurModel, selectBlurModel };
};

/**
 * How the user wants to arrive in a call — remembered, because it is a habit rather than a per-call decision.
 *
 * A provider that cannot be told about a device is not asked about it: the returned value reports the device as
 * off, so nothing claims to have configured something it can't.
 */
export const useCallPreferences = (capabilities: VideoConferenceCapabilities) => {
	const [stored, setStored] = useLocalStorage<StoredCallPreferences>('videoconf-call-preferences', DEFAULTS);

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

	const { ring, toggleRing } = useCallRingPreference();

	const selectDevice = useCallback(
		(device: CallDeviceKind, deviceId: string) => setStored((current) => ({ ...current, [`${device}Id`]: deviceId })),
		[setStored],
	);

	return { preferences, devices, ring, toggle, toggleRing, selectDevice };
};
