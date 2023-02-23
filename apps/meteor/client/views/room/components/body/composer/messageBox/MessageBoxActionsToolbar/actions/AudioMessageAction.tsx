import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { MessageComposerAction } from '@rocket.chat/ui-composer';
import { useTranslation, useSetting } from '@rocket.chat/ui-contexts';
import type { AllHTMLAttributes } from 'react';
import React, { useEffect, useMemo } from 'react';

import { AudioRecorder } from '../../../../../../../../../app/ui/client';
import type { ChatAPI } from '../../../../../../../../lib/chats/ChatAPI';
import { useChat } from '../../../../../../contexts/ChatContext';

const audioRecorder = new AudioRecorder();

type AudioMessageActionProps = {
	chatContext?: ChatAPI;
	isMicrophoneDenied?: boolean;
} & Omit<AllHTMLAttributes<HTMLButtonElement>, 'is'>;

const AudioMessageAction = ({ chatContext, disabled, isMicrophoneDenied, ...props }: AudioMessageActionProps) => {
	const t = useTranslation();
	const chat = useChat() ?? chatContext;

	const handleRecordButtonClick = () => chat?.composer?.setRecordingMode(true);

	const handleMount = useMutableCallback(async (): Promise<void> => {
		if (navigator.permissions) {
			try {
				const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
				chat?.composer?.setIsMicrophoneDenied(permissionStatus.state === 'denied');
				permissionStatus.onchange = (): void => {
					chat?.composer?.setIsMicrophoneDenied(permissionStatus.state === 'denied');
				};
				return;
			} catch (error) {
				console.warn(error);
			}
		}

		if (!navigator.mediaDevices?.enumerateDevices) {
			chat?.composer?.setIsMicrophoneDenied(true);
			return;
		}

		try {
			if (!(await navigator.mediaDevices.enumerateDevices()).some(({ kind }) => kind === 'audioinput')) {
				chat?.composer?.setIsMicrophoneDenied(true);
				return;
			}
		} catch (error) {
			console.warn(error);
		}
	});

	useEffect(() => {
		handleMount();
	}, [handleMount]);

	const isFileUploadEnabled = useSetting('FileUpload_Enabled') as boolean;
	const isAudioRecorderEnabled = useSetting('Message_AudioRecorderEnabled') as boolean;
	const fileUploadMediaTypeBlackList = useSetting('FileUpload_MediaTypeBlackList') as string;
	const fileUploadMediaTypeWhiteList = useSetting('FileUpload_MediaTypeWhiteList') as string;

	const isAllowed = useMemo(
		() =>
			audioRecorder.isSupported() &&
			!isMicrophoneDenied &&
			isFileUploadEnabled &&
			isAudioRecorderEnabled &&
			!fileUploadMediaTypeBlackList?.match(/audio\/mp3|audio\/\*/i) &&
			(!fileUploadMediaTypeWhiteList || fileUploadMediaTypeWhiteList.match(/audio\/mp3|audio\/\*/i)),
		[fileUploadMediaTypeBlackList, fileUploadMediaTypeWhiteList, isAudioRecorderEnabled, isFileUploadEnabled, isMicrophoneDenied],
	);

	return (
		<MessageComposerAction
			title={!isAllowed ? t('error-not-allowed') : t('Audio_message')}
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
