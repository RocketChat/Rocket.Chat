import { Box, IconButton, Tooltip, Position } from '@rocket.chat/fuselage';
import { MessageComposerAction } from '@rocket.chat/ui-composer';
import React, { ReactElement, useRef } from 'react';

import { useAudioMessageRecorder, AudioMessageRecorderProps } from './hooks/useAudioMessageRecorder';

const AudioMessageRecorder = ({ rid, tmid }: AudioMessageRecorderProps): ReactElement | null => {
	const ref = useRef(null);
	const {
		isMicrophoneDenied,
		isNotSupported,
		isAllowed,

		state,
		time,
		handleCancelButtonClick,
		handleDoneButtonClick,
		handleRecordButtonClick,
	} = useAudioMessageRecorder({
		rid,
		tmid,
	});

	if (isNotSupported) {
		return <MessageComposerAction ref={ref} icon='mic-off' title='Audio recording is not supported by your browser' disabled />;
	}

	if (isMicrophoneDenied) {
		return <MessageComposerAction ref={ref} icon='mic-off' title='Microphone is denied' onClick={handleRecordButtonClick} />;
	}

	if (!isAllowed) {
		return <MessageComposerAction ref={ref} icon='mic-off' title='Audio recording is disabled by the server' disabled />;
	}

	if (state === 'recording') {
		return (
			<>
				<Position anchor={ref} placement={'top-middle'}>
					<Tooltip>
						<Box display='flex' alignItems='center' pointerEvents='all'>
							<IconButton small icon='circle-cross' onClick={handleCancelButtonClick} />
							{time}
							<IconButton small icon='circle-check' onClick={handleDoneButtonClick} />
						</Box>
					</Tooltip>
				</Position>
				<MessageComposerAction ref={ref} icon='mic' onClick={handleCancelButtonClick} />
			</>
		);
	}

	if (state === 'idle') {
		return <MessageComposerAction icon='mic' onClick={handleRecordButtonClick} />;
	}

	return null;
};

export default AudioMessageRecorder;
