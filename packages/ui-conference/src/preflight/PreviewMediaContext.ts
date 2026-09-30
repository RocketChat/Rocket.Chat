import type { VideoConferenceCapabilities } from '@rocket.chat/core-typings';

import type { useCallDevicePreview } from './useCallDevicePreview';
import { createRequiredContext } from '../lib/createRequiredContext';

export type PreviewMediaState = {
	capabilities: VideoConferenceCapabilities;
	preview: ReturnType<typeof useCallDevicePreview>;
};

export const [PreviewMediaContextProvider, usePreviewMedia] = createRequiredContext<PreviewMediaState>('PreviewMedia');
