import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useEffect, useMemo } from 'react';

import { VideoRecorder } from '../../../../../../../app/ui/client/lib/recorderjs/videoRecorder';
import { useChat } from '../../../../contexts/ChatContext';
import { useMediaActionTitle } from '../../hooks/useMediaActionTitle';
import { useMediaPermissions } from '../../hooks/useMediaPermissions';

export const useVideoMessageAction = (disabled: boolean): GenericMenuItemProps => {
	const isFileUploadEnabled = useSetting('FileUpload_Enabled', true);
	const isVideoRecorderEnabled = useSetting('Message_VideoRecorderEnabled', true);
	const fileUploadMediaTypeBlackList = useSetting('FileUpload_MediaTypeBlackList', 'image/svg+xml');
	const fileUploadMediaTypeWhiteList = useSetting('FileUpload_MediaTypeWhiteList', '');
	const [isPermissionDenied, setIsPermissionDenied] = useMediaPermissions('camera');

	const isAllowed = useMemo(
		() =>
			Boolean(
				!isPermissionDenied &&
					navigator.mediaDevices &&
					window.MediaRecorder &&
					isFileUploadEnabled &&
					isVideoRecorderEnabled &&
					!fileUploadMediaTypeBlackList?.match(/video\/webm|video\/\*/i) &&
					(!fileUploadMediaTypeWhiteList || fileUploadMediaTypeWhiteList.match(/video\/webm|video\/\*/i)) &&
					Boolean(VideoRecorder.getSupportedMimeTypes()),
			),
		[fileUploadMediaTypeBlackList, fileUploadMediaTypeWhiteList, isFileUploadEnabled, isPermissionDenied, isVideoRecorderEnabled],
	);

	const getMediaActionTitle = useMediaActionTitle('video', isPermissionDenied, isFileUploadEnabled, isVideoRecorderEnabled, isAllowed);

	const chat = useChat();

	const handleOpenVideoMessage = () => {
		if (!chat?.composer?.recordingVideo.get()) {
			chat?.composer?.setRecordingVideo(true);
		}
	};

	const handleDenyVideo = useEffectEvent((isDenied: boolean) => {
		if (isDenied) {
			chat?.composer?.setRecordingVideo(false);
		}

		setIsPermissionDenied(isDenied);
	});

	useEffect(() => {
		handleDenyVideo(isPermissionDenied);
	}, [handleDenyVideo, isPermissionDenied]);

	return {
		id: 'video-message',
		content: getMediaActionTitle,
		icon: 'video-message',
		disabled: !isAllowed || Boolean(disabled),
		onClick: handleOpenVideoMessage,
	};
};
