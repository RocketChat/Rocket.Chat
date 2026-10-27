import type { VideoConferenceCapabilities } from '@rocket.chat/core-typings';
import type { DeviceSelection } from '@rocket.chat/ui-media';
import { DeviceSelectionProvider } from '@rocket.chat/ui-media';
import type { ReactNode } from 'react';
import { Suspense, useMemo } from 'react';

import { PreviewMediaContextProvider } from './PreviewMediaContext';
import { useCallDevicePreview } from './useCallDevicePreview';
import { NOISE_METHOD_LABELS, VIDEO_QUALITY_LABELS, choicesOf } from '../call/lib/mediaChoiceLabels';
import type { PreflightMedia } from '../context/definitions';
import type { NoiseSuppressionSelection } from '../devices/NoiseSuppressionContext';
import { NoiseSuppressionProvider, supportsRnnoise } from '../devices/NoiseSuppressionContext';
import type { VideoQualitySelection } from '../devices/VideoQualityContext';
import { VideoQualityProvider } from '../devices/VideoQualityContext';
import { useCallDevicesInitialState, useNoiseSuppressionPreference, useVideoQualityPreference } from '../hooks/useCallDevicesInitialState';

const QUALITIES = choicesOf(VIDEO_QUALITY_LABELS);

const NOISE_METHODS = choicesOf(NOISE_METHOD_LABELS).filter((method) => method !== 'rnnoise' || supportsRnnoise());

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
	const { noiseMethod, selectNoiseMethod } = useNoiseSuppressionPreference();

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

	// Only recorded here: the preview's microphone is not sent anywhere, so the call is where the choice is applied.
	const noiseSuppression = useMemo(
		(): NoiseSuppressionSelection => ({
			// A remembered method this browser cannot run is what the call will fall back to.
			method: NOISE_METHODS.includes(noiseMethod) ? noiseMethod : 'browser',
			methods: NOISE_METHODS,
			pending: false,
			select: selectNoiseMethod,
		}),
		[noiseMethod, selectNoiseMethod],
	);

	return (
		<PreviewMediaContextProvider value={value}>
			<DeviceSelectionProvider value={deviceSelection}>
				<VideoQualityProvider value={videoQualitySelection}>
					<NoiseSuppressionProvider value={noiseSuppression}>
						{/* The preflight is shown without a camera while a lazy provider loads, rather than held back for it. */}
						<Suspense fallback={children}>
							<media.PreviewVideoProvider enabled={preferences.cam} deviceId={devices.camId} quality={videoQuality}>
								{children}
							</media.PreviewVideoProvider>
						</Suspense>
					</NoiseSuppressionProvider>
				</VideoQualityProvider>
			</DeviceSelectionProvider>
		</PreviewMediaContextProvider>
	);
};

export default PreviewMediaProvider;
