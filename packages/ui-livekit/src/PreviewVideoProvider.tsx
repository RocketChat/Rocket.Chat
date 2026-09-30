import { PreviewVideoContext, useMediaDevices } from '@rocket.chat/ui-conference';
import type { ReactNode } from 'react';

import { usePreviewVideoTrack } from './usePreviewVideoTrack';

export type PreviewVideoProviderProps = {
	enabled: boolean;
	deviceId?: string;
	children: ReactNode;
};

/**
 * The preflight's camera, opened with LiveKit and handed to `children` through `usePreviewVideo`. A component, so
 * an application can load it lazily and keep the LiveKit SDK out of its bundle.
 */
export const PreviewVideoProvider = ({ enabled, deviceId, children }: PreviewVideoProviderProps) => {
	// Camera permission is what names the cameras on the device lists.
	const { refresh } = useMediaDevices();
	const preview = usePreviewVideoTrack(enabled, { deviceId, onOpen: refresh });

	return <PreviewVideoContext.Provider value={preview}>{children}</PreviewVideoContext.Provider>;
};
