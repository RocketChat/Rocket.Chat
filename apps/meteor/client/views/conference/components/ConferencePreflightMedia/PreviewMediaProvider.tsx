import type { VideoConferenceCapabilities } from '@rocket.chat/core-typings';
import { useBackgroundBlurPreference, useCallDevicesInitialState, useVideoQualityPreference } from '@rocket.chat/ui-conference';
import type { ReactNode } from 'react';
import { useMemo } from 'react';

import { PreviewMediaContext } from './PreviewMediaContext';
import { useCallDevicePreview } from '../../hooks/useCallDevicePreview';
import { usePreviewVideoTrack } from '../../hooks/usePreviewVideoTrack';

/** Opens the preview's camera and microphone once, for both halves of the preflight, for as long as it is shown. */
const PreviewMediaProvider = ({ capabilities, children }: { capabilities: VideoConferenceCapabilities; children: ReactNode }) => {
	const { preferences, devices } = useCallDevicesInitialState(capabilities);
	const { videoQuality } = useVideoQualityPreference();
	const { blurLevel, blurModel } = useBackgroundBlurPreference();

	const preview = useCallDevicePreview(true, preferences, devices);

	// The camera as a LiveKit track, so the blur chosen below is the blur the call will send.
	const previewVideo = usePreviewVideoTrack(preferences.cam, { deviceId: devices.camId, quality: videoQuality, blurLevel, blurModel });

	const value = useMemo(() => ({ capabilities, preview, previewVideo }), [capabilities, preview, previewVideo]);

	return <PreviewMediaContext.Provider value={value}>{children}</PreviewMediaContext.Provider>;
};

export default PreviewMediaProvider;
