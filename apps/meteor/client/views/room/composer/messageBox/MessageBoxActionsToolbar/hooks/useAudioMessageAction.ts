import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useEffect, useMemo } from 'react';

import { AudioRecorder } from '../../../../../../lib/AudioRecorder';
import { useChat } from '../../../../contexts/ChatContext';
import { useComposerCapabilities } from '../../../ComposerCapabilitiesContext';
import { useMediaActionTitle } from '../../hooks/useMediaActionTitle';
import { useMediaPermissions } from '../../hooks/useMediaPermissions';

const audioRecorder = new AudioRecorder();

export const useAudioMessageAction = (disabled: boolean, isMicrophoneDenied: boolean): GenericMenuItemProps => {
	const {
		fileUploadEnabled: isFileUploadEnabled,
		audioRecorderEnabled: isAudioRecorderEnabled,
		mediaTypeBlackList: fileUploadMediaTypeBlackList,
		mediaTypeWhiteList: fileUploadMediaTypeWhiteList,
	} = useComposerCapabilities();
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

	const stopRecording = useStableCallback(() => {
		chat?.action.stop('recording');

		chat?.composer?.setRecordingMode(false);
	});

	const setMicrophoneDenied = useStableCallback((isDenied: boolean) => {
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
