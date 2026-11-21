import { BackgroundEffectContext } from '@rocket.chat/ui-conference';
import type { LocalVideoTrack } from 'livekit-client';
import type { ReactNode } from 'react';

import { usePreviewBackgroundEffect } from './usePreviewBackgroundEffect';

type PreviewBackgroundEffectProps = {
	track: LocalVideoTrack | undefined;
	segmentationBaseUrl: string;
	children: ReactNode;
};

export const PreviewBackgroundEffect = ({ track, segmentationBaseUrl, children }: PreviewBackgroundEffectProps) => {
	const backgroundEffect = usePreviewBackgroundEffect(track, segmentationBaseUrl);

	return <BackgroundEffectContext.Provider value={backgroundEffect}>{children}</BackgroundEffectContext.Provider>;
};
