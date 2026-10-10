import type { MediaProcessorAssets } from '@rocket.chat/media-processors';
import type { PreviewVideoProviderProps } from '@rocket.chat/ui-conference';
import { PreviewVideoContext } from '@rocket.chat/ui-conference';
import { useMediaDevices } from '@rocket.chat/ui-media';

import { usePreviewVideoTrack } from './usePreviewVideoTrack';

export type LiveKitPreviewVideoProviderProps = PreviewVideoProviderProps & {
	/** Where the workspace serves the blur runtime files. */
	assets: MediaProcessorAssets;
};

/**
 * The preflight's camera, opened with LiveKit and handed to `children` through `usePreviewVideo`. A component, so
 * an application can load it lazily and keep the LiveKit SDK out of its bundle.
 */
export const PreviewVideoProvider = ({
	enabled,
	deviceId,
	quality,
	blurLevel,
	blurModel,
	assets,
	children,
}: LiveKitPreviewVideoProviderProps) => {
	// Camera permission is what names the cameras on the device lists.
	const { refresh } = useMediaDevices();
	const preview = usePreviewVideoTrack(enabled, { deviceId, quality, blurLevel, blurModel, onOpen: refresh }, assets);

	return <PreviewVideoContext.Provider value={preview}>{children}</PreviewVideoContext.Provider>;
};
