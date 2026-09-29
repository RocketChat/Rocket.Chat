import type { MediaProcessorAssets } from '@rocket.chat/media-processors';
import type { BlurLevel, BlurModel, VideoQuality } from '@rocket.chat/ui-conference';
import { useEffect } from 'react';

import type { PreviewVideo } from './usePreviewVideoTrack';
import { usePreviewVideoTrack } from './usePreviewVideoTrack';

export type PreviewVideoTrackProps = {
	enabled: boolean;
	deviceId?: string;
	quality: VideoQuality;
	blurLevel: BlurLevel;
	blurModel?: BlurModel;
	assets: MediaProcessorAssets;
	onChange: (preview: PreviewVideo) => void;
};

/**
 * {@link usePreviewVideoTrack} as a component, so an application can load it lazily and keep the LiveKit SDK out of
 * its bundle. Renders nothing; the camera is reported through `onChange`.
 */
export const PreviewVideoTrack = ({ enabled, deviceId, quality, blurLevel, blurModel, assets, onChange }: PreviewVideoTrackProps) => {
	const preview = usePreviewVideoTrack(enabled, { deviceId, quality, blurLevel, blurModel }, assets);

	useEffect(() => onChange(preview), [preview, onChange]);

	return null;
};
