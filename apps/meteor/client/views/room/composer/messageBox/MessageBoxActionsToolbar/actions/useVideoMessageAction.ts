import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useEffect, useMemo } from 'react';

import { VideoRecorder } from '../../../../../../../app/ui/client/lib/recorderjs/videoRecorder';
import { useChat } from '../../../../contexts/ChatContext';
import { useMediaActionTitle } from '../../hooks/useMediaActionTitle';
import { useMediaPermissions } from '../../hooks/useMediaPermissions';

const useVideoMessageAction = () => {
	const isFileUploadEnabled = useSetting('FileUpload_Enabled') as boolean;
	const isVideoRecorderEnabled = useSetting('Message_VideoRecorderEnabled') as boolean;
	const fileUploadMediaTypeBlackList = useSetting('FileUpload_MediaTypeBlackList') as string;
	const fileUploadMediaTypeWhiteList = useSetting('FileUpload_MediaTypeWhiteList') as string;
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

	const handleDenyVideo = useMutableCallback((isDenied) => {
		if (isDenied) {
			chat?.composer?.setRecordingVideo(false);
		}

		setIsPermissionDenied(isDenied);
	});

	useEffect(() => {
		handleDenyVideo(isPermissionDenied);
	}, [handleDenyVideo, isPermissionDenied]);

	return { handleOpenVideoMessage, videoTitle: getMediaActionTitle, isVideoAllowed: isAllowed };
};

export default useVideoMessageAction;
