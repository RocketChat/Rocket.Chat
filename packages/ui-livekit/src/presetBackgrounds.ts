import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

export type PresetBackground = { id: string; url: string };

const NO_PRESETS: PresetBackground[] = [];

/**
 * The backgrounds the workspace offers every call: nothing while they load, and none when they cannot be listed, so a
 * call is never held up by them.
 */
export const usePresetBackgrounds = (): PresetBackground[] | undefined => {
	const getBackgrounds = useEndpoint('GET', '/v1/video-conference.backgrounds');
	const { data, isError } = useQuery({
		queryKey: ['video-conference', 'backgrounds'],
		queryFn: async () => (await getBackgrounds()).backgrounds,
		staleTime: Infinity,
	});
	return isError ? NO_PRESETS : data;
};
