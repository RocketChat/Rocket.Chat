import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { MessageComposerAction } from '@rocket.chat/ui-composer';
import { useSetting } from '@rocket.chat/ui-contexts';
import type { AllHTMLAttributes } from 'react';
import React, { useEffect, useMemo } from 'react';

import { AudioRecorder } from '../../../../../../../app/ui/client/lib/recorderjs/AudioRecorder';
import type { ChatAPI } from '../../../../../../lib/chats/ChatAPI';
import { useChat } from '../../../../contexts/ChatContext';
import { useMediaActionTitle } from '../../hooks/useMediaActionTitle';
import { useMediaPermissions } from '../../hooks/useMediaPermissions';

const audioRecorder = new AudioRecorder();

type AudioMessageActionProps = {
	chatContext?: ChatAPI;
	isMicrophoneDenied?: boolean;
} & Omit<AllHTMLAttributes<HTMLButtonElement>, 'is'>;

const AudioMessageAction = ({ chatContext, disabled, isMicrophoneDenied, ...props }: AudioMessageActionProps) => {
	const isFileUploadEnabled = useSetting('FileUpload_Enabled') as boolean;
	const isAudioRecorderEnabled = useSetting('Message_AudioRecorderEnabled') as boolean;
	const fileUploadMediaTypeBlackList = useSetting('FileUpload_MediaTypeBlackList') as string;
	const fileUploadMediaTypeWhiteList = useSetting('FileUpload_MediaTypeWhiteList') as string;
	const [isPermissionDenied] = useMediaPermissions('microphone');

	const isAllowed = useMemo(
		() =>
			Boolean(
				audioRecorder.isSupported() &&
					!isMicrophoneDenied &&
					isFileUploadEnabled &&
					isAudioRecorderEnabled &&
					!fileUploadMediaTypeBlackList?.match(/audio\/mp3|audio\/\*/i) &&
					(!fileUploadMediaTypeWhiteList || fileUploadMediaTypeWhiteList.match(/audio\/mp3|audio\/\*/i)),
			),
		[fileUploadMediaTypeBlackList, fileUploadMediaTypeWhiteList, isAudioRecorderEnabled, isFileUploadEnabled, isMicrophoneDenied],
	);

	const getMediaActionTitle = useMediaActionTitle('audio', isPermissionDenied, isFileUploadEnabled, isAudioRecorderEnabled, isAllowed);

	const chat = useChat() ?? chatContext;

	const stopRecording = useMutableCallback(() => {
		chat?.action.stop('recording');

		chat?.composer?.setRecordingMode(false);
	});

	const setMicrophoneDenied = useMutableCallback((isDenied) => {
		if (isDenied) {
			stopRecording();
		}

		chat?.composer?.setIsMicrophoneDenied(isDenied);
	});

	useEffect(() => {
		setMicrophoneDenied(isPermissionDenied);
	}, [setMicrophoneDenied, isPermissionDenied]);

	const handleRecordButtonClick = () => chat?.composer?.setRecordingMode(true);

	return (
		<MessageComposerAction
			title={getMediaActionTitle}
			icon='mic'
			disabled={disabled || !isAllowed}
			className='rc-message-box__icon rc-message-box__audio-message-mic'
			data-qa-id='audio-record'
			onClick={handleRecordButtonClick}
			{...props}
		/>
	);
};

export default AudioMessageAction;
