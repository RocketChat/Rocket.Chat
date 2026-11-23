import type { PreflightMedia } from '@rocket.chat/ui-conference';
import { lazy } from 'react';

import { backgroundEffectsBaseUrl } from '../../../lib/videoConference/backgroundEffectsBaseUrl';

/** The reader's own camera on the preflight, opened with LiveKit for a provider that runs the call in here. */
export const conferencePreflightMedia: PreflightMedia = {
	// Lazy, so the LiveKit SDK is fetched by the preflight rather than with the app.
	PreviewVideoProvider: lazy(() =>
		import('@rocket.chat/ui-livekit').then(({ PreviewVideoProvider }) => ({ default: PreviewVideoProvider })),
	),
	backgroundEffectsBaseUrl,
};
