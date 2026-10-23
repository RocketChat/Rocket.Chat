import { createRequiredContext } from '@rocket.chat/ui-media';

import type { VideoQuality } from '../hooks/useCallDevicesInitialState';

/**
 * The most detail the camera sends, for the camera menus. The preflight fills it with the stored preference; a call
 * running in this window, with what its camera track was restarted at.
 */
export type VideoQualitySelection = {
	quality: VideoQuality;
	qualities: VideoQuality[];
	/** What is actually being sent, which is not always what was asked for. */
	height?: number;
	pending: boolean;
	select: (quality: VideoQuality) => void;
};

export const [VideoQualityProvider, useVideoQualitySelection] = createRequiredContext<VideoQualitySelection>('VideoQuality');
