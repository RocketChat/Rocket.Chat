import { IMessage, IRoom } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetting, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useState } from 'react';

import { UserAction, USER_ACTIVITIES, fileUpload } from '../../../../../../../../app/ui/client';
import { useIsRecorderEnabled } from '../../hooks/useIsRecorderEnabled';
import { useRecordingState } from '../../hooks/useRecordingState';

export const getUserMedia: typeof navigator.mediaDevices.getUserMedia = async (props) => {
	const oldGetUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

	if (navigator.mediaDevices) {
		return navigator.mediaDevices.getUserMedia(props);
	}
	if (oldGetUserMedia) {
		return new Promise((resolve, handle) => oldGetUserMedia.call(navigator, props, resolve, handle));
	}

	throw new Error('getUserMedia not supported');
};

export type VideoMessageRecorderProps = {
	rid: IRoom['_id'];
	tmid?: IMessage['_id'];
};

type RecordingState = {
	isAllowed: boolean;
	isNotSupported: boolean;
};

const isVideoRecordingSupported =
	navigator.mediaDevices && window.MediaRecorder && window.MediaRecorder.isTypeSupported('video/webm; codecs=vp8,opus');

export const useVideoMessageRecorderIsEnabled = (): RecordingState => {
	const { isAllowed: isUploadAllowed, isNotSupported } = useIsRecorderEnabled(/video\/webm|video\/\*/i);

	const videoRecorderEnabled = Boolean(useSetting('Message_VideoRecorderEnabled'));

	return {
		isAllowed: isUploadAllowed && videoRecorderEnabled,
		isNotSupported: isNotSupported || !isVideoRecordingSupported,
	};
};

export const useVideoMessageRecorder = ({ rid, tmid }: VideoMessageRecorderProps) => {
	const { isAllowed, isNotSupported } = useVideoMessageRecorderIsEnabled();

	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();
	const [state, setState] = useRecordingState();
	const [time, setTime] = useState('00:00');
	const [isMicrophoneDenied, setIsMicrophoneDenied] = useState(false);
	const [recordingInterval, setRecordingInterval] = useState<ReturnType<typeof setInterval> | null>(null);
	const [recordingRoomId, setRecordingRoomId] = useState<IRoom['_id'] | null>(null);

	const stopRecording = useMutableCallback(async () => {
		UserAction.stop(rid, USER_ACTIVITIES.USER_RECORDING, { tmid });
	});

	const handleRecordButtonClick = useMutableCallback(async () => {
		if (recordingRoomId && recordingRoomId !== rid) {
			return;
		}

		try {
			const userMediaStream = await getUserMedia({ audio: true, video: true });

			const recorder = new MediaRecorder(userMediaStream);
			recorder.start();

			const chunks: Blob[] = [];

			recorder.ondataavailable = (e): void => {
				chunks.push(e.data);
			};

			setState('recording');
			UserAction.performContinuously(rid, USER_ACTIVITIES.USER_RECORDING, { tmid });
		} catch (error) {
			console.log(error);
			dispatchToastMessage({ type: 'error', message: t('VideoRecorder_error') });
		}
	});

	const handleUnmount = useMutableCallback(async () => {
		if (state === 'recording') {
			await stopRecording();
		}
	});

	const handleCancelButtonClick = useMutableCallback(async () => {
		await stopRecording();
	});

	const handleDoneButtonClick = useMutableCallback(async () => {
		setState('loading');

		const blob = await stopRecording();

		const fileName = `${t('Audio_record')}.mp3`;
		const file = new File([blob], fileName, { type: 'audio/mpeg' });

		await fileUpload([{ file, name: fileName }], [], { rid, tmid });
	});

	return {
		state,
		setState,
		time,
		recordingInterval,
		recordingRoomId,
		stopRecording,
		handleUnmount,
		setRecordingInterval,
		setRecordingRoomId,
		setIsMicrophoneDenied,
		setTime,
		handleCancelButtonClick,
		handleRecordButtonClick,
		handleDoneButtonClick,
		isAllowed,
		isNotSupported,
		isMicrophoneDenied,
	};
};
