/* eslint-disable no-unused-vars */

import { Box, Throbber } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { MessageComposerAction } from '@rocket.chat/ui-composer';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement, useEffect, useMemo, useState } from 'react';

import CheckAudioIcon from '../../icons/circle-check.svg';
import CancelAudioIcon from '../../icons/circle-cross.svg';
import { AudioRecorder } from '../../lib/audioRecorder';
import { ComposerAction, ComposerActions } from '../Composer';
import { createClassName } from '../helpers';
import styles from './styles.scss';

const audioRecorder = new AudioRecorder();

const AudioRecorderBar = ({ handleRecording, onUpload }) => {
	const t = useTranslation();

	// const [state, setState] = (useState < 'loading') | ('recording' > 'recording');
	const [time, setTime] = useState('00:00');
	const [recordingInterval, setRecordingInterval] = useState(0);
	// // const [recordingRoomId, setRecordingRoomId] = (useState < IRoom._id) | (null > null);

	const stopRecording = useMutableCallback(async () => {
		if (recordingInterval) {
			clearInterval(recordingInterval);
		}
		console.log(audioRecorder);
		setRecordingInterval(null);
		handleRecording();
		// setRecordingRoomId(null);

		setTime('00:00');

		// chat?.action.stop('recording');

		// chat?.composer?.setRecordingMode(false);

		const blob = (await new Promise()) < Blob > ((resolve) => audioRecorder.stop(resolve));

		return blob;
	});

	const handleDoneButtonClick = useMutableCallback(async () => {
		// setState('loading');
		console.log(audioRecorder);
		const blob = await stopRecording();

		const fileName = `${t('Audio_record')}.mp3`;
		const file = new File([blob], fileName, { type: 'audio/mpeg' });
		console.log(file);
		await onUpload(file);
		// await chat?.flows.uploadFiles([file]);
	});

	const handleUnmount = useMutableCallback(async () => {
		// if (state === 'recording') {
		await stopRecording();
		// }
	});

	const handleRecord = useMutableCallback(async () => {
		// if (recordingRoomId && recordingRoomId !== rid) {
		// 	return;
		// }

		try {
			await audioRecorder.start();
			console.log(audioRecorder, 'started');
			// chat?.action.performContinuously('recording');
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
			// setRecordingRoomId(rid);
		} catch (error) {
			console.log(error);
			// chat?.composer?.setRecordingMode(false);
		}
	});
	useEffect(() => {
		handleRecord();

		// return () => {
		// 	handleUnmount();
		// };
	}, [handleRecord]);

	const handleCancelButtonClick = useMutableCallback(async () => {
		await stopRecording();
	});

	// if (isMicrophoneDenied) {
	// 	return null;
	// }
	return (
		<Box pi='x4'>
			{/* {state === 'recording' && ( */}
			<div className={createClassName(styles, 'audio-message')}>
				<ComposerActions>
					<ComposerAction className={createClassName(styles, 'audio-message__cancel')} onClick={handleCancelButtonClick}>
						<CancelAudioIcon width={20} height={20} />
					</ComposerAction>
				</ComposerActions>
				<Box className={createClassName(styles, 'audio-message__timer')} color='default'>
					<span className={createClassName(styles, 'audio-message__timer__dot')} />
					<span className={createClassName(styles, 'audio-message__timer__timer-text')}>{time}</span>
				</Box>
				<ComposerActions>
					<ComposerAction className={createClassName(styles, 'audio-message__done')} onClick={handleDoneButtonClick}>
						<CheckAudioIcon width={20} height={20} />
					</ComposerAction>
				</ComposerActions>
			</div>
			{/* // )}
			// {state === 'loading' && (
			// 	<div className='rc-message-box__icon'>
			// 		<Throbber inheritColor size='x12' />
			// 	</div>
			// )} */}
		</Box>
	);
};

export default AudioRecorderBar;
