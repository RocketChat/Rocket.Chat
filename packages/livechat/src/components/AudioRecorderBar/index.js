/* eslint-disable no-unused-vars */

import { Box, Throbber } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { MessageComposerAction } from '@rocket.chat/ui-composer';
import React, { ReactElement, useEffect, useMemo, useState } from 'react';
import { withTranslation } from 'react-i18next';

import CheckAudioIcon from '../../icons/circle-check.svg';
import CancelAudioIcon from '../../icons/circle-cross.svg';
import { AudioRecorder } from '../../lib/audioRecorder';
import { ComposerAction, ComposerActions } from '../Composer';
import { createClassName } from '../helpers';
import styles from './styles.scss';

const audioRecorder = new AudioRecorder();

const AudioRecorderBar = ({ handleRecording, onUpload }) => {
	const [time, setTime] = useState('00:00');
	const [recordingInterval, setRecordingInterval] = useState(0);
	const stopRecording = useMutableCallback(async () => {
		if (recordingInterval) {
			clearInterval(recordingInterval);
		}
		setRecordingInterval(null);
		handleRecording();

		setTime('00:00');
		const blob = await new Promise((resolve, reject) => {
			console.log(resolve);
			audioRecorder.stop(resolve);
		});

		return blob;
	});

	const handleDoneButtonClick = useMutableCallback(async () => {
		console.log(audioRecorder);
		const blob = await stopRecording();
		console.log(blob, 'blob');
		const fileName = `${'Audio_record'}.mp3`;
		const file = new File([blob], fileName, { type: 'audio/mpeg' });
		console.log(file);
		await onUpload([file]);
	});

	const handleUnmount = useMutableCallback(async () => {
		await stopRecording();
	});

	const handleRecord = useMutableCallback(async () => {
		try {
			await audioRecorder.start();
			console.log(audioRecorder, 'started');
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
		} catch (error) {
			console.log(error);
		}
	});
	useEffect(() => {
		handleRecord();
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

export default withTranslation()(AudioRecorderBar);
