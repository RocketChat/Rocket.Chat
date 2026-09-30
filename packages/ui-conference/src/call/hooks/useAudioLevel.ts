import { useCallback, useSyncExternalStore } from 'react';

import { getAudioLevel, subscribeToAudioLevel } from '../lib/audioLevelStore';

/** Guarded because callers hand over whatever they have: a preview stream, a stub in a test, nothing at all. */
const hasAudio = (stream?: MediaStream | null): stream is MediaStream =>
	Boolean(stream) && typeof stream?.getAudioTracks === 'function' && stream.getAudioTracks().length > 0;

const noSubscription = () => undefined;

/** How loud the stream is, from 0 to 1, sampled about twelve times a second; 0 without an audio track. */
export const useAudioLevel = (stream?: MediaStream | null): number => {
	const measured = hasAudio(stream) ? stream : undefined;

	const subscribe = useCallback(
		(onChange: () => void) => (measured ? subscribeToAudioLevel(measured, onChange) : noSubscription),
		[measured],
	);

	return useSyncExternalStore(subscribe, () => (measured ? getAudioLevel(measured) : 0));
};
