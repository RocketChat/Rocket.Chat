import type { IRoom } from '@rocket.chat/core-typings';
import { Box, Throbber } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { MessageComposerAction } from '@rocket.chat/ui-composer';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useEffect, useMemo, useState } from 'react';

import { AudioRecorder } from '../../../../app/ui/client/lib/recorderjs/AudioRecorder';
import type { ChatAPI } from '../../../lib/chats/ChatAPI';
import { useChat } from '../../room/contexts/ChatContext';

const audioRecorder = new AudioRecorder();

type AudioMessageRecorderProps = {
	rid: IRoom['_id'];
	chatContext?: ChatAPI; // TODO: remove this when the composer is migrated to React
	isMicrophoneDenied?: boolean;
};

const AudioMessageRecorder = ({ rid, chatContext, isMicrophoneDenied }: AudioMessageRecorderProps): ReactElement | null => {
	const t = useTranslation();

	const [state, setState] = useState<'loading' | 'recording'>('recording');
	const [time, setTime] = useState('00:00');
	const [recordingInterval, setRecordingInterval] = useState<ReturnType<typeof setInterval> | null>(null);
	const [recordingRoomId, setRecordingRoomId] = useState<IRoom['_id'] | null>(null);

	const stopRecording = useMutableCallback(async () => {
		if (recordingInterval) {
			clearInterval(recordingInterval);
		}
		setRecordingInterval(null);
		setRecordingRoomId(null);

		setTime('00:00');

		chat?.action.stop('recording');

		chat?.composer?.setRecordingMode(false);

		const blob = await new Promise<Blob>((resolve) => audioRecorder.stop(resolve));

		return blob;
	});

	const handleUnmount = useMutableCallback(async () => {
		if (state === 'recording') {
			await stopRecording();
		}
	});

	const handleRecord = useMutableCallback(async () => {
		if (recordingRoomId && recordingRoomId !== rid) {
			return;
		}

		try {
			await audioRecorder.start();
			chat?.action.performContinuously('recording');
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
			chat?.composer?.setRecordingMode(false);
		}
	});

	const handleCancelButtonClick = useMutableCallback(async () => {
		await stopRecording();
	});

	const chat = useChat() ?? chatContext;

	const handleDoneButtonClick = useMutableCallback(async () => {
		setState('loading');

		const blob = await stopRecording();

		const fileName = `${t('Audio_record')}.mp3`;
		const file = new File([blob], fileName, { type: 'audio/mpeg' });

		await chat?.flows.uploadFiles([file]);
	});

	useEffect(() => {
		handleRecord();

		return () => {
			handleUnmount();
		};
	}, [handleUnmount, handleRecord]);

	const stateClass = useMemo(() => {
		if (recordingRoomId && recordingRoomId !== rid) {
			return 'rc-message-box__audio-message--busy';
		}

		return state && `rc-message-box__audio-message--${state}`;
	}, [recordingRoomId, rid, state]);

	if (isMicrophoneDenied) {
		return null;
	}

	return (
		<Box position='absolute' pi={4} pb={12} className={`rc-message-box__audio-message ${stateClass}`}>
			{state === 'recording' && (
				<>
					<MessageComposerAction
						icon='circle-cross'
						className='rc-message-box__icon rc-message-box__audio-message-cancel'
						onClick={handleCancelButtonClick}
					/>
					<Box className='rc-message-box__audio-message-timer' color='default'>
						<span className='rc-message-box__audio-message-timer-dot'></span>
						<span className='rc-message-box__audio-message-timer-text'>{time}</span>
					</Box>
					<MessageComposerAction
						icon='circle-check'
						className='rc-message-box__icon rc-message-box__audio-message-done'
						onClick={handleDoneButtonClick}
					/>
				</>
			)}
			{state === 'loading' && (
				<div className='rc-message-box__icon'>
					<Throbber inheritColor size='x12' />
				</div>
			)}
		</Box>
	);
};

export default AudioMessageRecorder;
