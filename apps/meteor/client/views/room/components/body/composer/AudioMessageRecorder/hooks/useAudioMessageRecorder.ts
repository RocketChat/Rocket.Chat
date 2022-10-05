import { IMessage, IRoom } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetting, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useEffect, useMemo, useState } from 'react';

import { AudioRecorder, fileUpload, UserAction, USER_ACTIVITIES } from '../../../../../../../../app/ui/client';

const audioRecorder = new AudioRecorder();

export type AudioMessageRecorderProps = {
	rid: IRoom['_id'];
	tmid: IMessage['_id'];
};

export const useAudioMessageRecorder = ({ rid, tmid }: AudioMessageRecorderProps) => {
	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();
	const [state, setState] = useState<'idle' | 'loading' | 'recording'>('idle');
	const [time, setTime] = useState('00:00');
	const [isMicrophoneDenied, setIsMicrophoneDenied] = useState(false);
	const [recordingInterval, setRecordingInterval] = useState<ReturnType<typeof setInterval> | null>(null);
	const [recordingRoomId, setRecordingRoomId] = useState<IRoom['_id'] | null>(null);

	const stopRecording = useMutableCallback(async () => {
		if (recordingInterval) {
			clearInterval(recordingInterval);
		}
		setRecordingInterval(null);
		setRecordingRoomId(null);

		setTime('00:00');

		const blob = await new Promise<Blob>((resolve) => audioRecorder.stop(resolve));
		UserAction.stop(rid, USER_ACTIVITIES.USER_RECORDING, { tmid });

		setState('idle');

		return blob;
	});

	const handleMount = useMutableCallback(async (): Promise<void> => {
		if (navigator.permissions) {
			try {
				const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
				setIsMicrophoneDenied(permissionStatus.state === 'denied');
				permissionStatus.onchange = (): void => {
					setIsMicrophoneDenied(permissionStatus.state === 'denied');
				};
				return;
			} catch (error) {
				console.warn(error);
			}
		}

		if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
			setIsMicrophoneDenied(true);
			return;
		}

		try {
			if (!(await navigator.mediaDevices.enumerateDevices()).some(({ kind }) => kind === 'audioinput')) {
				setIsMicrophoneDenied(true);
				return;
			}
		} catch (error) {
			console.warn(error);
		}
	});

	const handleUnmount = useMutableCallback(async () => {
		if (state === 'recording') {
			await stopRecording();
		}
	});

	useEffect(() => {
		handleMount();

		return (): void => {
			handleUnmount();
		};
	}, [handleMount, handleUnmount]);

	const isFileUploadEnabled = useSetting('FileUpload_Enabled') as boolean;
	const isAudioRecorderEnabled = useSetting('Message_AudioRecorderEnabled') as boolean;
	const fileUploadMediaTypeBlackList = useSetting('FileUpload_MediaTypeBlackList') as string;
	const fileUploadMediaTypeWhiteList = useSetting('FileUpload_MediaTypeWhiteList') as string;

	const isNotSupported = !audioRecorder.isSupported();

	const isAllowed = useMemo(
		() =>
			isFileUploadEnabled &&
			isAudioRecorderEnabled &&
			(!fileUploadMediaTypeBlackList || !fileUploadMediaTypeBlackList.match(/audio\/mp3|audio\/\*/i)) &&
			(!fileUploadMediaTypeWhiteList || fileUploadMediaTypeWhiteList.match(/audio\/mp3|audio\/\*/i)),
		[fileUploadMediaTypeBlackList, fileUploadMediaTypeWhiteList, isAudioRecorderEnabled, isFileUploadEnabled],
	);

	const handleRecordButtonClick = useMutableCallback(async () => {
		if (recordingRoomId && recordingRoomId !== rid) {
			return;
		}

		setState('recording');

		try {
			await audioRecorder.start();
			UserAction.performContinuously(rid, USER_ACTIVITIES.USER_RECORDING, { tmid });
			const startTime = new Date();
			setRecordingInterval(
				setInterval(() => {
					const now = new Date();
					const distance = (now.getTime() - startTime.getTime()) / 1000;
					const minutes = Math.floor(distance / 60);
					const seconds = Math.floor(distance % 60);
					setTime(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
				}, 1000),
			);
			setRecordingRoomId(rid);
		} catch (error) {
			console.log(error);
			dispatchToastMessage({ type: 'error', message: t('AudioRecorder_error') });
			setIsMicrophoneDenied(true);
			setState('idle');
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
		handleMount,
		handleUnmount,
		setRecordingInterval,
		setRecordingRoomId,
		setIsMicrophoneDenied,
		setTime,
		handleCancelButtonClick,
		handleDoneButtonClick,
		handleRecordButtonClick,
		isAllowed,
		isNotSupported,
		isMicrophoneDenied,
	};
};
