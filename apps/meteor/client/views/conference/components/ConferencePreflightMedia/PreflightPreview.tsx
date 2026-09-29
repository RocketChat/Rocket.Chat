import { Box } from '@rocket.chat/fuselage';
import { PreflightCameraPlaceholder, VoiceActivity, useCallDevicesInitialState } from '@rocket.chat/ui-conference';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { usePreviewMedia } from './PreviewMediaContext';

const PreflightPreview = () => {
	const { t } = useTranslation();
	const { capabilities, preview, previewVideo } = usePreviewMedia();
	const { preferences } = useCallDevicesInitialState(capabilities);

	// Attached by the track rather than through `srcObject`: `attach` is what hands over the *processed* track when
	// a processor is running, which is the reason the preview is a LiveKit track at all.
	const { track } = previewVideo;
	const videoRef = useCallback(
		(node: HTMLVideoElement | null) => {
			if (!node || !track) {
				return;
			}

			track.attach(node);

			return () => {
				track.detach(node);
			};
		},
		[track],
	);

	const failed = preferences.cam && (preview.error || previewVideo.error);

	return (
		<>
			{preferences.cam && track ? (
				<Box
					is='video'
					ref={videoRef}
					autoPlay
					playsInline
					muted
					width='100%'
					height='100%'
					objectFit='cover'
					// Mirrored, because a self-view that isn't reads as someone else's camera.
					style={{ transform: 'scaleX(-1)' }}
				/>
			) : (
				<PreflightCameraPlaceholder cam={preferences.cam} note={failed ? t('Could_not_access_your_camera') : undefined} />
			)}

			{/* Proof before joining that the microphone is picked up — the one thing this screen can't otherwise show. */}
			{preferences.mic && preview.stream && (
				<Box position='absolute' insetBlockEnd={12} insetInlineStart={12} display='flex'>
					<VoiceActivity stream={preview.stream} size={16} badge />
				</Box>
			)}
		</>
	);
};

export default PreflightPreview;
