import type { VideoConferenceCapabilities } from '@rocket.chat/core-typings';
import { useCallDevicesInitialState, useVideoQualityPreference } from '@rocket.chat/ui-conference';
import type { PreviewVideo } from '@rocket.chat/ui-livekit';
import type { ReactNode } from 'react';
import { Suspense, lazy, useMemo, useState } from 'react';

import { PreviewMediaContext } from './PreviewMediaContext';
import { useCallDevicePreview } from '../../hooks/useCallDevicePreview';

// Lazy, so the LiveKit SDK is only fetched by a preflight that shows a camera.
const PreviewVideoTrack = lazy(() => import('@rocket.chat/ui-livekit').then(({ PreviewVideoTrack }) => ({ default: PreviewVideoTrack })));

const NO_PREVIEW_VIDEO: PreviewVideo = { error: false };

/** Opens the preview's camera and microphone once, for both halves of the preflight, for as long as it is shown. */
const PreviewMediaProvider = ({ capabilities, children }: { capabilities: VideoConferenceCapabilities; children: ReactNode }) => {
	const { preferences, devices } = useCallDevicesInitialState(capabilities);
	const { videoQuality } = useVideoQualityPreference();

	const preview = useCallDevicePreview(preferences, devices);

	const [previewVideo, setPreviewVideo] = useState(NO_PREVIEW_VIDEO);

	const value = useMemo(() => ({ capabilities, preview, previewVideo }), [capabilities, preview, previewVideo]);

	return (
		<PreviewMediaContext.Provider value={value}>
			<Suspense fallback={null}>
				<PreviewVideoTrack enabled={preferences.cam} deviceId={devices.camId} quality={videoQuality} onChange={setPreviewVideo} />
			</Suspense>
			{children}
		</PreviewMediaContext.Provider>
	);
};

export default PreviewMediaProvider;
