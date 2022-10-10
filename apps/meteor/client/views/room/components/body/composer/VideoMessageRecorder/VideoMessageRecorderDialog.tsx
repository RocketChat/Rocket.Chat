import { IconButton, Button } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement, useEffect, useRef } from 'react';

import { useVideoMessageRecorder } from './hooks/useVideoMessageRecorder';

const VideoMessageRecorderDialog = ({ rid, tmid }: { rid: string; tmid?: string }): ReactElement => {
	const t = useTranslation();
	const ref = useRef(null);

	const { time, handleCancelButtonClick, handleDoneButtonClick, handleRecordButtonClick } = useVideoMessageRecorder({
		rid,
		tmid,
	});

	// useEffect(() => {
	// 	if (!ref.current) {
	// 		return;
	// 	}

	// 	try {
	// 		ref.current.srcObject = userMediaStream;
	// 	} catch (error) {
	// 		const URL = window.URL || window.webkitURL;
	// 		ref.current.src = URL.createObjectURL(userMediaStream);
	// 	}

	// 	ref.current.muted = true;
	// 	ref.current.onloadedmetadata = () => {
	// 		ref.current?.play();
	// 	};

	// 	return (): void => {
	// 		handleUnmount();
	// 	};
	// }, [handleUnmount]);

	return (
		<div className='rc-old vrec-dialog secondary-background-color'>
			<div className='video-container'>
				<video ref={ref} width='320' height='240' src=''></video>
			</div>
			<div className='buttons'>
				<IconButton small icon='circle-cross' onClick={handleRecordButtonClick} />
				<span>{time}</span>
				<IconButton small icon='circle-cross' onClick={handleRecordButtonClick} />
				<IconButton small icon='circle-check' onClick={handleCancelButtonClick} />
				<Button onClick={handleDoneButtonClick}>{t('Ok')}</Button>
			</div>
		</div>
	);
};

export default VideoMessageRecorderDialog;
