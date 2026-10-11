import type { PreflightMedia } from '@rocket.chat/ui-conference';
import { lazy } from 'react';

/** The reader's own camera on the preflight, opened with LiveKit for a provider that runs the call in here. */
export const conferencePreflightMedia: PreflightMedia = {
	// Lazy, so the LiveKit SDK is only fetched by a preflight that shows a camera.
	PreviewVideoProvider: lazy(() =>
		import('@rocket.chat/ui-livekit').then(({ PreviewVideoProvider }) => ({ default: PreviewVideoProvider })),
	),
};
