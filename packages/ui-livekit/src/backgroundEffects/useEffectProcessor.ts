import type { LocalVideoTrack } from 'livekit-client';
import { TrackEvent } from 'livekit-client';
import { useCallback, useSyncExternalStore } from 'react';

import { frameHeightOf, onEffectProcessorChange, processorOf } from './effectProcessor';

const noop = () => undefined;

const useTrackEvent = (track: LocalVideoTrack | undefined, event: TrackEvent.TrackProcessorUpdate | TrackEvent.Restarted) =>
	useCallback(
		(listener: () => void) => {
			if (!track) {
				return noop;
			}
			track.on(event, listener);
			return () => {
				track.off(event, listener);
			};
		},
		[track, event],
	);

/** The camera's background processor and the effect it is running, if it has one. */
export const useEffectProcessor = (track: LocalVideoTrack | undefined) => {
	const processor = useSyncExternalStore(onEffectProcessorChange, () => processorOf(track));
	const effect = useSyncExternalStore(onEffectProcessorChange, () => processorOf(track)?.effect);

	return { processor, effect };
};

/** What the camera sends once processed; absent without a processor. */
export const useProcessedTrack = (track: LocalVideoTrack | undefined) =>
	useSyncExternalStore(useTrackEvent(track, TrackEvent.TrackProcessorUpdate), () => track?.getProcessor()?.processedTrack);

export const useFrameHeight = (track: LocalVideoTrack | undefined) =>
	useSyncExternalStore(useTrackEvent(track, TrackEvent.Restarted), () => frameHeightOf(track));
