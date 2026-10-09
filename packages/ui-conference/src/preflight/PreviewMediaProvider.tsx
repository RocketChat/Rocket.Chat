import type { VideoConferenceCapabilities } from '@rocket.chat/core-typings';
import type { DeviceSelection } from '@rocket.chat/ui-media';
import { DeviceSelectionProvider } from '@rocket.chat/ui-media';
import type { ReactNode } from 'react';
import { Suspense, useMemo } from 'react';

import { PreviewMediaContextProvider } from './PreviewMediaContext';
import { useCallDevicePreview } from './useCallDevicePreview';
import { VIDEO_QUALITY_LABELS, choicesOf } from '../call/lib/mediaChoiceLabels';
import type { PreflightMedia } from '../context/definitions';
import type { VideoQualitySelection } from '../devices/VideoQualityContext';
import { VideoQualityProvider } from '../devices/VideoQualityContext';
import { useBackgroundBlurPreference, useCallDevicesInitialState, useVideoQualityPreference } from '../hooks/useCallDevicesInitialState';

const QUALITIES = choicesOf(VIDEO_QUALITY_LABELS);

export type PreviewMediaProviderProps = {
	capabilities: VideoConferenceCapabilities;
	/** How the application opens the preview's camera. */
	media: PreflightMedia;
	children: ReactNode;
};

/**
 * Opens the preview's camera and microphone once, for both halves of the preflight, for as long as it is shown; and
 * offers the devices to choose, recording each choice for the join to carry.
 */
const PreviewMediaProvider = ({ capabilities, media, children }: PreviewMediaProviderProps) => {
	const { preferences, devices, selectDevice } = useCallDevicesInitialState(capabilities);
	const { videoQuality, selectVideoQuality } = useVideoQualityPreference();
	const { blurLevel, blurModel } = useBackgroundBlurPreference();

	const preview = useCallDevicePreview(preferences, devices);

	const value = useMemo(() => ({ capabilities, preview }), [capabilities, preview]);

	const deviceSelection = useMemo(
		(): DeviceSelection => ({
			devices: preview.devices,
			selectedIds: { audioinput: devices.micId, videoinput: devices.camId, audiooutput: devices.speakerId },
			select: selectDevice,
		}),
		[preview.devices, devices, selectDevice],
	);

	const videoQualitySelection = useMemo(
		(): VideoQualitySelection => ({ quality: videoQuality, qualities: QUALITIES, pending: false, select: selectVideoQuality }),
		[videoQuality, selectVideoQuality],
	);

	return (
		<PreviewMediaContextProvider value={value}>
			<DeviceSelectionProvider value={deviceSelection}>
				<VideoQualityProvider value={videoQualitySelection}>
					<media.MediaProcessingProvider>
						{/* The preflight is shown without a camera while a lazy provider loads, rather than held back for it. */}
						<Suspense fallback={children}>
							<media.PreviewVideoProvider
								enabled={preferences.cam}
								deviceId={devices.camId}
								quality={videoQuality}
								blurLevel={blurLevel}
								blurModel={blurModel}
							>
								{children}
							</media.PreviewVideoProvider>
						</Suspense>
					</media.MediaProcessingProvider>
				</VideoQualityProvider>
			</DeviceSelectionProvider>
		</PreviewMediaContextProvider>
	);
};

export default PreviewMediaProvider;
