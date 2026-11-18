import type { BackgroundEffect, BackgroundPreference } from '@rocket.chat/ui-conference';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

export type PresetBackground = { id: string; url: string };

const NO_PRESETS: PresetBackground[] = [];

/** How long a call joining with a remembered preset waits for the list before it goes ahead without one. */
export const PRESETS_WAIT_MS = 3000;

/**
 * The backgrounds the workspace offers every call: nothing while they load, and none when they cannot be listed or
 * are slow to, so a call is never held up by them.
 */
export const usePresetBackgrounds = (): PresetBackground[] | undefined => {
	const getBackgrounds = useEndpoint('GET', '/v1/video-conference.backgrounds');
	const { data, isError } = useQuery({
		queryKey: ['video-conference', 'backgrounds'],
		queryFn: async () => (await getBackgrounds()).backgrounds,
		staleTime: Infinity,
	});

	const [waitedOut, setWaitedOut] = useState(false);
	const loading = !data && !isError;
	useEffect(() => {
		if (!loading) {
			return;
		}
		const timer = setTimeout(() => setWaitedOut(true), PRESETS_WAIT_MS);
		return () => clearTimeout(timer);
	}, [loading]);

	return data ?? (isError || waitedOut ? NO_PRESETS : undefined);
};

/** The effect a remembered background stands for, once the presets it may name are known; none for one gone since. */
export const effectFor = (preference: BackgroundPreference, presets: PresetBackground[] | undefined): BackgroundEffect | undefined => {
	if (preference.mode !== 'preset') {
		return preference;
	}
	if (!presets) {
		return undefined;
	}
	const preset = presets.find(({ id }) => id === preference.id);
	return preset ? { mode: 'image', imageUrl: preset.url } : { mode: 'none' };
};

/** What to remember of `effect`; an uploaded image does not outlive the call, so it is remembered as none. */
export const preferenceFor = (effect: BackgroundEffect, presets: PresetBackground[] | undefined): BackgroundPreference => {
	if (effect.mode !== 'image') {
		return effect;
	}
	const preset = presets?.find(({ url }) => url === effect.imageUrl);
	return preset ? { mode: 'preset', id: preset.id } : { mode: 'none' };
};
