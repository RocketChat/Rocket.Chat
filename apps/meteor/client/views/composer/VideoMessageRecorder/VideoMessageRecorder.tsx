import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Box, ButtonGroup, Button, Icon, PositionAnimated } from '@rocket.chat/fuselage';
import { useTranslation, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { AllHTMLAttributes, RefObject } from 'react';
import React, { useRef, useEffect, useState } from 'react';

import { VideoRecorder, UserAction, USER_ACTIVITIES } from '../../../../app/ui/client';
import type { ChatAPI } from '../../../lib/chats/ChatAPI';
import { useChat } from '../../room/contexts/ChatContext';

type VideoMessageRecorderProps = {
	rid: IRoom['_id'];
	tmid?: IMessage['_id'];
	chatContext?: ChatAPI; // TODO: remove this when the composer is migrated to React
	reference: RefObject<HTMLElement>;
} & Omit<AllHTMLAttributes<HTMLDivElement>, 'is'>;

const videoContainerClass = css`
	transform: scaleX(-1);
	filter: FlipH;

	@media (width <= 500px) {
		& > video {
			width: 100%;
			height: 100%;
		}
	}
`;

const VideoMessageRecorder = ({ rid, tmid, chatContext, reference }: VideoMessageRecorderProps) => {
	const t = useTranslation();
	const videoRef = useRef<HTMLVideoElement>(null);
	const dispatchToastMessage = useToastMessageDispatch();

	const [time, setTime] = useState('');
	const [recordingState, setRecordingState] = useState<'idle' | 'loading' | 'recording'>('idle');
	const [recordingInterval, setRecordingInterval] = useState<ReturnType<typeof setInterval> | null>(null);
	const isRecording = recordingState === 'recording';
	const sendButtonDisabled = !(VideoRecorder.cameraStarted.get() && !(recordingState === 'recording'));

	const chat = useChat() ?? chatContext;

	const stopVideoRecording = async (rid: IRoom['_id'], tmid?: IMessage['_id']) => {
		if (recordingInterval) {
			clearInterval(recordingInterval);
		}
		setRecordingInterval(null);
		UserAction.stop(rid, USER_ACTIVITIES.USER_RECORDING, { tmid });
		setRecordingState('idle');
	};

	const handleRecord = async () => {
		if (recordingState === 'recording') {
			VideoRecorder.stopRecording();
			stopVideoRecording(rid, tmid);
		} else {
			VideoRecorder.record();
			setRecordingState('recording');
			UserAction.performContinuously(rid, USER_ACTIVITIES.USER_RECORDING, { tmid });
			setTime('00:00');
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
		}
	};

	const handleSendRecord = async () => {
		const cb = async (blob: Blob) => {
			const fileName = `${t('Video_record')}.webm`;
			const file = new File([blob], fileName, { type: 'video/webm' });
			await chat?.flows.uploadFiles([file]);
			chat?.composer?.setRecordingVideo(false);
		};

		VideoRecorder.stop(cb);
		setTime('');
		stopVideoRecording(rid, tmid);
	};

	const handleCancel = () => {
		VideoRecorder.stop();
		chat?.composer?.setRecordingVideo(false);
		setTime('');
		stopVideoRecording(rid, tmid);
	};

	useEffect(() => {
		if (!window.MediaRecorder.isTypeSupported('video/webm; codecs=vp8,opus')) {
			return dispatchToastMessage({ type: 'error', message: t('Browser_does_not_support_recording_video') });
		}

		VideoRecorder.start(videoRef.current);

		return () => {
			VideoRecorder.stop();
		};
	}, [dispatchToastMessage, t]);

	return (
		<PositionAnimated visible='visible' anchor={reference} placement='top-end'>
			<Box bg='light' padding='x4' borderRadius='x4' elevation='2'>
				<Box className={videoContainerClass} overflow='hidden' height='240px' borderRadius='x4'>
					<video ref={videoRef} width='320' height='240'></video>
				</Box>
				<Box mbs='x4' display='flex' justifyContent='space-between'>
					<Button small onClick={handleRecord}>
						<Box display='flex' alignItems='center'>
							<Icon size='x16' mie='x4' name={isRecording ? 'stop-unfilled' : 'rec'} />
							<span>{time}</span>
						</Box>
					</Button>
					<ButtonGroup>
						<Button small onClick={handleCancel}>
							{t('Cancel')}
						</Button>
						<Button primary small disabled={sendButtonDisabled} onClick={handleSendRecord}>
							{t('Send')}
						</Button>
					</ButtonGroup>
				</Box>
			</Box>
		</PositionAnimated>
	);
};

export default VideoMessageRecorder;
