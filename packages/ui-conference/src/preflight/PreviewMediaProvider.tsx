import type { VideoConferenceCapabilities } from '@rocket.chat/core-typings';
import type { ReactNode } from 'react';
import { Suspense, useMemo } from 'react';

import { PreviewMediaContextProvider } from './PreviewMediaContext';
import { useCallDevicePreview } from './useCallDevicePreview';
import type { PreflightMedia } from '../context/definitions';
import { useCallDevicesInitialState } from '../hooks/useCallDevicesInitialState';

export type PreviewMediaProviderProps = {
	capabilities: VideoConferenceCapabilities;
	/** How the application opens the preview's camera. */
	media: PreflightMedia;
	children: ReactNode;
};

/** Opens the preview's camera and microphone once, for both halves of the preflight, for as long as it is shown. */
const PreviewMediaProvider = ({ capabilities, media, children }: PreviewMediaProviderProps) => {
	const { preferences, devices } = useCallDevicesInitialState(capabilities);

	const preview = useCallDevicePreview(preferences, devices);

	const value = useMemo(() => ({ capabilities, preview }), [capabilities, preview]);

	return (
		<PreviewMediaContextProvider value={value}>
			{/* The preflight is shown without a camera while a lazy provider loads, rather than held back for it. */}
			<Suspense fallback={children}>
				<media.PreviewVideoProvider enabled={preferences.cam} deviceId={devices.camId}>
					{children}
				</media.PreviewVideoProvider>
			</Suspense>
		</PreviewMediaContextProvider>
	);
};

export default PreviewMediaProvider;
