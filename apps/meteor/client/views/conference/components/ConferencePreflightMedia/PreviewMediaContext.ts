import type { VideoConferenceCapabilities } from '@rocket.chat/core-typings';
import { createContext, useContext } from 'react';

import type { useCallDevicePreview } from '../../hooks/useCallDevicePreview';
import type { usePreviewVideoTrack } from '../../hooks/usePreviewVideoTrack';

type PreviewMediaState = {
	capabilities: VideoConferenceCapabilities;
	preview: ReturnType<typeof useCallDevicePreview>;
	previewVideo: ReturnType<typeof usePreviewVideoTrack>;
};

export const PreviewMediaContext = createContext<PreviewMediaState | undefined>(undefined);

export const usePreviewMedia = (): PreviewMediaState => {
	const state = useContext(PreviewMediaContext);
	if (!state) {
		throw new Error('the preflight preview is rendered outside its media provider');
	}
	return state;
};
