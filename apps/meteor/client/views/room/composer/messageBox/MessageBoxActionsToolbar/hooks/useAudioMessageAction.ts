import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useEffect, useMemo } from 'react';

import { AudioRecorder } from '../../../../../../../app/ui/client/lib/recorderjs/AudioRecorder';
import { useChat } from '../../../../contexts/ChatContext';
import { useMediaActionTitle } from '../../hooks/useMediaActionTitle';
import { useMediaPermissions } from '../../hooks/useMediaPermissions';

const audioRecorder = new AudioRecorder();

export const useAudioMessageAction = (disabled: boolean, isMicrophoneDenied: boolean): GenericMenuItemProps => {
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

	const chat = useChat();

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

	return {
		id: 'audio-message',
		content: getMediaActionTitle,
		icon: 'mic',
		disabled: !isAllowed || Boolean(disabled),
		onClick: handleRecordButtonClick,
	};
};
