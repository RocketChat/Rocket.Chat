import type { PreflightMedia, PreviewVideoProviderProps } from '@rocket.chat/ui-conference';
import { createElement, lazy } from 'react';

import { segmentationBaseUrl } from '../../../lib/videoConference/segmentationBaseUrl';

/** The reader's own camera on the preflight, opened with LiveKit for a provider that runs the call in here. */
export const conferencePreflightMedia: PreflightMedia = {
	// Lazy, so the LiveKit SDK is only fetched by a preflight that shows a camera.
	PreviewVideoProvider: lazy(() =>
		import('@rocket.chat/ui-livekit').then(({ PreviewVideoProvider }) => ({
			default: (props: PreviewVideoProviderProps) => createElement(PreviewVideoProvider, { ...props, segmentationBaseUrl }),
		})),
	),
};
