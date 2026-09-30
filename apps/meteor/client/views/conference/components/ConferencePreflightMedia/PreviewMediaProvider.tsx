import type { VideoConferenceCapabilities } from '@rocket.chat/core-typings';
import { useCallDevicesInitialState } from '@rocket.chat/ui-conference';
import type { ReactNode } from 'react';
import { Suspense, lazy, useMemo } from 'react';

import { PreviewMediaContext } from './PreviewMediaContext';
import { useCallDevicePreview } from '../../hooks/useCallDevicePreview';

// Lazy, so the LiveKit SDK is only fetched by a preflight that shows a camera.
const PreviewVideoProvider = lazy(() =>
	import('@rocket.chat/ui-livekit').then(({ PreviewVideoProvider }) => ({ default: PreviewVideoProvider })),
);

/** Opens the preview's camera and microphone once, for both halves of the preflight, for as long as it is shown. */
const PreviewMediaProvider = ({ capabilities, children }: { capabilities: VideoConferenceCapabilities; children: ReactNode }) => {
	const { preferences, devices } = useCallDevicesInitialState(capabilities);

	const preview = useCallDevicePreview(preferences, devices);

	const value = useMemo(() => ({ capabilities, preview }), [capabilities, preview]);

	return (
		<PreviewMediaContext.Provider value={value}>
			{/* The preflight is shown without a camera while the SDK loads, rather than held back for it. */}
			<Suspense fallback={children}>
				<PreviewVideoProvider enabled={preferences.cam} deviceId={devices.camId}>
					{children}
				</PreviewVideoProvider>
			</Suspense>
		</PreviewMediaContext.Provider>
	);
};

export default PreviewMediaProvider;
