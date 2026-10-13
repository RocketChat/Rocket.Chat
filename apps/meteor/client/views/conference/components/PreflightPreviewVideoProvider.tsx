import type { PreviewVideoProviderProps } from '@rocket.chat/ui-conference';
import { lazy } from 'react';

import { useMediaProcessorAssets } from '../hooks/useMediaProcessorAssets';

// Lazy, so the LiveKit SDK is only fetched by a preflight that shows a camera.
const LiveKitPreviewVideoProvider = lazy(() =>
	import('@rocket.chat/ui-livekit').then(({ PreviewVideoProvider }) => ({ default: PreviewVideoProvider })),
);

/** The reader's own camera on the preflight, opened with LiveKit and blurred with this workspace's files. */
const PreflightPreviewVideoProvider = ({ enabled, deviceId, quality, blurLevel, blurModel, children }: PreviewVideoProviderProps) => {
	const assets = useMediaProcessorAssets();

	return (
		<LiveKitPreviewVideoProvider
			enabled={enabled}
			deviceId={deviceId}
			quality={quality}
			blurLevel={blurLevel}
			blurModel={blurModel}
			assets={assets}
		>
			{children}
		</LiveKitPreviewVideoProvider>
	);
};

export default PreflightPreviewVideoProvider;
