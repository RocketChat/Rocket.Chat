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

/** Which devices to arrive on. Only a provider running the call in here can be told; the rest never see it. */
export type CallDevices = {
	micId?: string;
	camId?: string;
};

type StoredCallPreferences = CallPreferences & CallDevices;

/** Joining muted and unseen is the safe way into a call: it can only be a surprise in the harmless direction. */
const DEFAULTS: StoredCallPreferences = { mic: true, cam: false };

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

	const devices = useMemo((): CallDevices => ({ micId: stored.micId, camId: stored.camId }), [stored.micId, stored.camId]);

	const toggle = useCallback(
		(device: keyof CallPreferences) => setStored((current) => ({ ...current, [device]: !current[device] })),
		[setStored],
	);

	const selectDevice = useCallback(
		(device: keyof CallPreferences, deviceId: string) => setStored((current) => ({ ...current, [`${device}Id`]: deviceId })),
		[setStored],
	);

	return { preferences, devices, toggle, selectDevice };
};
