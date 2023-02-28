import { Option, OptionIcon, OptionContent } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { MessageComposerAction } from '@rocket.chat/ui-composer';
import { useTranslation, useSetting } from '@rocket.chat/ui-contexts';
import type { AllHTMLAttributes } from 'react';
import React, { useEffect, useState, useMemo } from 'react';

import type { ChatAPI } from '../../../../../../../../lib/chats/ChatAPI';
import { useChat } from '../../../../../../contexts/ChatContext';

type VideoMessageActionProps = {
	collapsed?: boolean;
	chatContext?: ChatAPI; // TODO: remove this when the composer is migrated to React
} & Omit<AllHTMLAttributes<HTMLButtonElement>, 'is'>;

const VideoMessageAction = ({ collapsed, chatContext, disabled, ...props }: VideoMessageActionProps) => {
	const t = useTranslation();
	const [isVideoDenied, setIsVideoDenied] = useState(false);
	const isFileUploadEnabled = useSetting('FileUpload_Enabled');
	const isVideoRecorderEnabled = useSetting('Message_VideoRecorderEnabled');
	const fileUploadMediaTypeBlackList = useSetting('FileUpload_MediaTypeBlackList') as string;
	const fileUploadMediaTypeWhiteList = useSetting('FileUpload_MediaTypeWhiteList') as string;

	const chat = useChat() ?? chatContext;

	const handleOpenVideoMessage = () => {
		if (!chat?.composer?.recordingVideo.get()) {
			chat?.composer?.setRecordingVideo(true);
		}
	};

	const handleDenyVideo = useMutableCallback((isDenied) => {
		if (isDenied) {
			chat?.composer?.setRecordingVideo(false);
		}

		setIsVideoDenied(isDenied);
	});

	const handleMount = useMutableCallback(async (): Promise<void> => {
		if (navigator.permissions) {
			try {
				const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
				handleDenyVideo(permissionStatus.state === 'denied');
				permissionStatus.onchange = (): void => {
					handleDenyVideo(permissionStatus.state === 'denied');
				};
				return;
			} catch (error) {
				console.warn(error);
			}
		}

		if (!navigator.mediaDevices?.enumerateDevices) {
			handleDenyVideo(true);
			return;
		}

		try {
			if (!(await navigator.mediaDevices.enumerateDevices()).some(({ kind }) => kind === 'videoinput')) {
				handleDenyVideo(true);
				return;
			}
		} catch (error) {
			console.warn(error);
		}
	});

	useEffect(() => {
		handleMount();
	}, [handleMount]);

	const isAllowed =
		!isVideoDenied &&
		navigator.mediaDevices &&
		window.MediaRecorder &&
		isFileUploadEnabled &&
		isVideoRecorderEnabled &&
		!fileUploadMediaTypeBlackList?.match(/video\/webm|video\/\*/i) &&
		(!fileUploadMediaTypeWhiteList || fileUploadMediaTypeWhiteList.match(/video\/webm|video\/\*/i)) &&
		window.MediaRecorder.isTypeSupported('video/webm; codecs=vp8,opus');

	const getVideoActionTitle = useMemo(() => {
		if (isVideoDenied) {
			return t('Camera_access_not_allowed');
		}

		if (!isFileUploadEnabled) {
			return t('File_Upload_Disabled');
		}

		if (!isVideoRecorderEnabled) {
			return t('Message_Video_Recording_Disabled');
		}

		if (!isAllowed) {
			return t('error-not-allowed');
		}

		return t('Video_message');
	}, [isVideoDenied, isFileUploadEnabled, isVideoRecorderEnabled, isAllowed, t]);

	if (collapsed) {
		return (
			<Option title={getVideoActionTitle} disabled={!isAllowed || disabled} onClick={handleOpenVideoMessage}>
				<OptionIcon name='video' />
				<OptionContent>{t('Video_message')}</OptionContent>
			</Option>
		);
	}

	return (
		<MessageComposerAction
			data-qa-id='video-message'
			icon='video'
			disabled={!isAllowed || disabled}
			onClick={handleOpenVideoMessage}
			title={getVideoActionTitle}
			{...props}
		/>
	);
};

export default VideoMessageAction;
