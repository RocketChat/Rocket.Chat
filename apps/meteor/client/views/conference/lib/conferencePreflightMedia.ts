import type { PreflightMedia } from '@rocket.chat/ui-conference';

import PreflightMediaProcessingProvider from '../components/PreflightMediaProcessingProvider';
import PreflightPreviewVideoProvider from '../components/PreflightPreviewVideoProvider';

/** The reader's own camera on the preflight, opened with LiveKit for a provider that runs the call in here. */
export const conferencePreflightMedia: PreflightMedia = {
	PreviewVideoProvider: PreflightPreviewVideoProvider,
	MediaProcessingProvider: PreflightMediaProcessingProvider,
};
