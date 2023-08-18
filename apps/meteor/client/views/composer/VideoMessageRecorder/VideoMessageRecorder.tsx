import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Box, ButtonGroup, Button, Icon, PositionAnimated } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { AllHTMLAttributes, RefObject } from 'react';
import React, { useRef, useEffect, useState } from 'react';

import { UserAction, USER_ACTIVITIES } from '../../../../app/ui/client/lib/UserAction';
import { VideoRecorder } from '../../../../app/ui/client/lib/recorderjs/videoRecorder';
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

	@media (max-width: 500px) {
		& > video {
			width: 100%;
			height: 100%;
		}
	}
`;

const getVideoRecordingExtension = () => {
	const supported = VideoRecorder.getSupportedMimeTypes();
	if (supported.match(/video\/webm/)) {
		return 'webm';
	}
	return 'mp4';
};

const VideoMessageRecorder = ({ rid, tmid, chatContext, reference }: VideoMessageRecorderProps) => {
	const t = useTranslation();
	const videoRef = useRef<HTMLVideoElement>(null);
	const dispatchToastMessage = useToastMessageDispatch();

	const [time, setTime] = useState<string | undefined>();
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
		VideoRecorder.stopRecording();
		UserAction.stop(rid, USER_ACTIVITIES.USER_RECORDING, { tmid });
		setRecordingState('idle');
	};

	const handleRecord = async () => {
		if (recordingState === 'recording') {
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
			const fileName = `${t('Video_record')}.${getVideoRecordingExtension()}`;
			const file = new File([blob], fileName, { type: VideoRecorder.getSupportedMimeTypes().split(';')[0] });
			await chat?.flows.uploadFiles([file]);
			chat?.composer?.setRecordingVideo(false);
		};

		VideoRecorder.stop(cb);
		setTime(undefined);
		stopVideoRecording(rid, tmid);
	};

	const handleCancel = useMutableCallback(() => {
		VideoRecorder.stop();
		chat?.composer?.setRecordingVideo(false);
		setTime(undefined);
		stopVideoRecording(rid, tmid);
	});

	useEffect(() => {
		if (!VideoRecorder.getSupportedMimeTypes()) {
			return dispatchToastMessage({ type: 'error', message: t('Browser_does_not_support_recording_video') });
		}

		VideoRecorder.start(videoRef.current ?? undefined, (success) => (!success ? handleCancel() : undefined));

		return () => {
			VideoRecorder.stop();
		};
	}, [dispatchToastMessage, handleCancel, t]);

	return (
		<PositionAnimated visible='visible' anchor={reference} placement='top-end'>
			<Box bg='light' padding={4} borderRadius={4} elevation='2'>
				<Box className={videoContainerClass} overflow='hidden' height={240} borderRadius={4}>
					<video muted autoPlay playsInline ref={videoRef} width={320} height={240} />
				</Box>
				<Box mbs={4} display='flex' justifyContent='space-between'>
					<Button small onClick={handleRecord}>
						<Box is='span' display='flex' alignItems='center'>
							<Icon size='x16' mie={time ? 4 : undefined} name={isRecording ? 'stop-unfilled' : 'rec'} />
							{time && <span>{time}</span>}
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
