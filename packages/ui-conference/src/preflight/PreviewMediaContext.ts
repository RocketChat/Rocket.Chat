import type { VideoConferenceCapabilities } from '@rocket.chat/core-typings';
import { createRequiredContext } from '@rocket.chat/ui-media';

import type { useCallDevicePreview } from './useCallDevicePreview';

export type PreviewMediaState = {
	capabilities: VideoConferenceCapabilities;
	preview: ReturnType<typeof useCallDevicePreview>;
};

export const [PreviewMediaContextProvider, usePreviewMedia] = createRequiredContext<PreviewMediaState>('PreviewMedia');
