import { useEffect } from 'react';

import type { PreviewVideo } from './usePreviewVideoTrack';
import { usePreviewVideoTrack } from './usePreviewVideoTrack';

export type PreviewVideoTrackProps = {
	enabled: boolean;
	deviceId?: string;
	onChange: (preview: PreviewVideo) => void;
};

/**
 * {@link usePreviewVideoTrack} as a component, so an application can load it lazily and keep the LiveKit SDK out of
 * its bundle. Renders nothing; the camera is reported through `onChange`.
 */
export const PreviewVideoTrack = ({ enabled, deviceId, onChange }: PreviewVideoTrackProps) => {
	const preview = usePreviewVideoTrack(enabled, { deviceId });

	useEffect(() => onChange(preview), [preview, onChange]);

	return null;
};
