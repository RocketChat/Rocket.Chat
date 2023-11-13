// import { Option, OptionIcon, OptionContent } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
// import { MessageComposerAction } from '@rocket.chat/ui-composer';
import { useTranslation, useSetting } from '@rocket.chat/ui-contexts';
import { useEffect, useMemo } from 'react';

import { VideoRecorder } from '../../../../../../../app/ui/client/lib/recorderjs/videoRecorder';
// import type { ChatAPI } from '../../../../../../lib/chats/ChatAPI';
import { useChat } from '../../../../contexts/ChatContext';
import { useMediaActionTitle } from '../../hooks/useMediaActionTitle';
import { useMediaPermissions } from '../../hooks/useMediaPermissions';
import type { ToolbarAction } from './ToolbarAction';

export const useVideoMessageAction = (disabled: boolean): ToolbarAction => {
	const t = useTranslation();
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

	return {
		id: 'video-message',
		title: getMediaActionTitle,
		disabled: !isAllowed || Boolean(disabled),
		onClick: handleOpenVideoMessage,
		icon: 'video',
		label: t('Video_message'),
	};

	// if (collapsed) {
	// 	return (
	// 		<Option title={getMediaActionTitle} disabled={!isAllowed || disabled} onClick={handleOpenVideoMessage}>
	// 			<OptionIcon name='video' />
	// 			<OptionContent>{t('Video_message')}</OptionContent>
	// 		</Option>
	// 	);
	// }

	// return (
	// 	<MessageComposerAction
	// 		data-qa-id='video-message'
	// 		icon='video'
	// 		disabled={!isAllowed || disabled}
	// 		onClick={handleOpenVideoMessage}
	// 		title={getMediaActionTitle}
	// 		{...props}
	// 	/>
	// );
};
