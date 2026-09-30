import type { VideoConferenceCapabilities } from '@rocket.chat/core-typings';
import type { ReactNode } from 'react';
import { Suspense, useMemo } from 'react';

import { PreviewMediaContextProvider } from './PreviewMediaContext';
import { useCallDevicePreview } from './useCallDevicePreview';
import type { PreflightMedia } from '../context/definitions';
import type { DeviceSelection } from '../devices/DeviceSelectionContext';
import { DeviceSelectionProvider } from '../devices/DeviceSelectionContext';
import { useCallDevicesInitialState } from '../hooks/useCallDevicesInitialState';

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

	return (
		<PreviewMediaContextProvider value={value}>
			<DeviceSelectionProvider value={deviceSelection}>
				{/* The preflight is shown without a camera while a lazy provider loads, rather than held back for it. */}
				<Suspense fallback={children}>
					<media.PreviewVideoProvider enabled={preferences.cam} deviceId={devices.camId}>
						{children}
					</media.PreviewVideoProvider>
				</Suspense>
			</DeviceSelectionProvider>
		</PreviewMediaContextProvider>
	);
};

export default PreviewMediaProvider;
