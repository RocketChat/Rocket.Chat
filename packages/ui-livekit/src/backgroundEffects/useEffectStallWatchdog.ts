import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { LocalVideoTrack } from 'livekit-client';
import { useEffect } from 'react';

import { forgetProcessor } from './effectProcessor';
import { useEffectProcessor } from './useEffectProcessor';

/** Takes the processor off a camera whose effect stops producing frames, then calls `onStalled`. */
export const useEffectStallWatchdog = (track: LocalVideoTrack | undefined, watching: boolean, onStalled: () => void) => {
	const { processor } = useEffectProcessor(track);
	const stalled = useStableCallback(onStalled);

	useEffect(() => {
		if (!watching || !track || !processor) {
			return;
		}
		return processor.watchStall(
			() => track.isMuted,
			() => {
				forgetProcessor(track);
				stalled();
				void track.stopProcessor().catch(() => undefined);
			},
		);
	}, [watching, track, processor, stalled]);
};
