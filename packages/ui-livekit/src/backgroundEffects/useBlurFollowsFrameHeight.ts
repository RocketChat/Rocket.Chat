import type { LocalVideoTrack } from 'livekit-client';
import { useEffect } from 'react';

import { useEffectProcessor, useFrameHeight } from './useEffectProcessor';

export const useBlurFollowsFrameHeight = (track: LocalVideoTrack | undefined) => {
	const { processor } = useEffectProcessor(track);
	const frameHeight = useFrameHeight(track);

	useEffect(() => {
		void processor?.matchFrameHeight(frameHeight).catch(() => undefined);
	}, [processor, frameHeight]);
};
