import { Icon, Throbber } from '@rocket.chat/fuselage';
import React, { ReactElement, useMemo } from 'react';

import { useAudioMessageRecorder, AudioMessageRecorderProps } from './hooks/useAudioMessageRecorder';

const AudioMessageRecorderOld = ({ rid, tmid }: AudioMessageRecorderProps): ReactElement | null => {
	const {
		state,
		time,
		handleCancelButtonClick,
		handleDoneButtonClick,
		handleRecordButtonClick,
		isAllowed,
		isNotSupported,
		isMicrophoneDenied,
		recordingRoomId,
	} = useAudioMessageRecorder({
		rid,
		tmid,
	});

	const stateClass = useMemo(() => {
		if (recordingRoomId && recordingRoomId !== rid) {
			return 'rc-message-box__audio-message--busy';
		}

		return state && `rc-message-box__audio-message--${state}`;
	}, [recordingRoomId, rid, state]);

	if (!isAllowed || isNotSupported || isMicrophoneDenied) {
		return null;
	}

	return (
		<div className={`rc-message-box__audio-message ${stateClass}`}>
			{state === 'recording' && (
				<>
					<div className='rc-message-box__icon rc-message-box__audio-message-cancel' onClick={handleCancelButtonClick}>
						<Icon name='circle-cross' size={24} />
					</div>
					<div className='rc-message-box__audio-message-timer'>
						<span className='rc-message-box__audio-message-timer-dot'></span>
						<span className='rc-message-box__audio-message-timer-text'>{time}</span>
					</div>
					<div className='rc-message-box__icon rc-message-box__audio-message-done' onClick={handleDoneButtonClick}>
						<Icon name='circle-check' size={24} />
					</div>
				</>
			)}
			{state === 'idle' && (
				<div className='rc-message-box__icon rc-message-box__audio-message-mic' data-qa-id='audio-record' onClick={handleRecordButtonClick}>
					<Icon name='mic' size={24} />
				</div>
			)}
			{state === 'loading' && (
				<div className='rc-message-box__icon'>
					<Throbber inheritColor size='x12' />
				</div>
			)}
		</div>
	);
};

export default AudioMessageRecorderOld;
