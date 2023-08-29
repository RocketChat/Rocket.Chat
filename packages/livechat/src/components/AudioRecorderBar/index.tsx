import { Box } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import { withTranslation } from 'react-i18next';

import { createClassName } from '../../helpers/createClassName';
import CheckAudioIcon from '../../icons/circle-check.svg';
import CancelAudioIcon from '../../icons/circle-cross.svg';
import { AudioRecorder } from '../../lib/audioRecorder';
import { ComposerAction, ComposerActions } from '../Composer';
import styles from './styles.scss';

const audioRecorder = new AudioRecorder();

type AudioMessageRecorderProps = {
	handleRecording: () => void;
	onUpload?: (files: (File | null)[]) => void;
	isMicrophoneDenied?: boolean;
};

const AudioRecorderBar = ({ handleRecording, onUpload }: AudioMessageRecorderProps): ReactElement | null => {
	const [time, setTime] = useState('00:00');
	const [recordingInterval, setRecordingInterval] = useState<ReturnType<typeof setInterval> | null>(null);
	const stopRecording = useMutableCallback(async () => {
		if (recordingInterval) {
			clearInterval(recordingInterval);
		}
		setRecordingInterval(null);
		handleRecording();

		setTime('00:00');
		const blob = await new Promise<Blob>((resolve) => {
			audioRecorder.stop(resolve);
		});

		return blob;
	});

	const handleDoneButtonClick = useMutableCallback(async () => {
		const blob = await stopRecording();
		const fileName = `${'Audio_record'}.mp3`;
		const file = new File([blob], fileName, { type: 'audio/mpeg' });
		if (onUpload) {
			onUpload([file]);
		}
	});

	const handleRecord = useMutableCallback(async () => {
		try {
			await audioRecorder.start();
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

	return (
		<Box pi='x4'>
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
		</Box>
	);
};

export default withTranslation()(AudioRecorderBar);
