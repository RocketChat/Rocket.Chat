import type { VideoConferenceCapabilities } from '@rocket.chat/core-typings';
import { useLocalStorage } from '@rocket.chat/fuselage-hooks';
import { useCallback, useMemo } from 'react';

export type CallPreferences = {
	mic: boolean;
	cam: boolean;
};

/** Joining muted and unseen is the safe way into a call: it can only be a surprise in the harmless direction. */
const DEFAULTS: CallPreferences = { mic: true, cam: false };

/**
 * How the user wants to arrive in a call — remembered, because it is a habit rather than a per-call decision.
 *
 * A provider that cannot be told about a device is not asked about it: the returned value reports the device as
 * off, so nothing claims to have configured something it can't.
 */
export const useCallPreferences = (capabilities: VideoConferenceCapabilities) => {
	const [stored, setStored] = useLocalStorage<CallPreferences>('videoconf-call-preferences', DEFAULTS);

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

	return { preferences, toggle };
};
