import type { IRoom } from '@rocket.chat/core-typings';
import { Box, Icon, Throbber } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { MessageComposerAction } from '@rocket.chat/ui-composer';
import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

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
	const { t } = useTranslation();

	const [state, setState] = useState<'loading' | 'recording'>('recording');
	const [time, setTime] = useState('00:00');
	const [recordingInterval, setRecordingInterval] = useState<ReturnType<typeof setInterval> | null>(null);
	const [recordingRoomId, setRecordingRoomId] = useState<IRoom['_id'] | null>(null);

	const stopRecording = useEffectEvent(async () => {
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

	const handleUnmount = useEffectEvent(async () => {
		if (state === 'recording') {
			await stopRecording();
		}
	});

	const handleRecord = useEffectEvent(async () => {
		chat?.composer?.setRecordingMode(true);

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

	const handleCancelButtonClick = useEffectEvent(async () => {
		await stopRecording();
	});

	const chat = useChat() ?? chatContext;

	const handleDoneButtonClick = useEffectEvent(async () => {
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

	if (isMicrophoneDenied) {
		return null;
	}

	return (
		<Box display='flex' position='absolute' color='default' pi={4} pb={12} role='group' aria-label={t('Audio_recorder')}>
			{state === 'recording' && (
				<>
					<MessageComposerAction icon='circle-cross' title={t('Cancel_recording')} onClick={handleCancelButtonClick} />
					<Box display='flex' alignItems='center' mi={4} justifyContent='center'>
						<Icon name='rec' color='red' />
						<Box fontScale='p2' mis={4} is='span' minWidth='x40'>
							{time}
						</Box>
					</Box>
					<MessageComposerAction icon='circle-check' title={t('Finish_recording')} onClick={handleDoneButtonClick} />
				</>
			)}
			{state === 'loading' && <Throbber inheritColor size='x12' />}
		</Box>
	);
};

export default AudioMessageRecorder;
