import { Position } from '@rocket.chat/fuselage';
import { useToggle } from '@rocket.chat/fuselage-hooks';
import { MessageComposerAction } from '@rocket.chat/ui-composer';
import React, { ReactElement, useRef } from 'react';

import VideoMessageRecorderDialog from './VideoMessageRecorderDialog';
import { useVideoMessageRecorderIsEnabled } from './hooks/useVideoMessageRecorder';

const VideoMessageRecorder = ({ rid, tmid }: { rid: string; tmid?: string }): ReactElement | null => {
	const positioningRef = useRef(null);
	const [open, toggleOpen] = useToggle(false);
	const { isNotSupported, isAllowed } = useVideoMessageRecorderIsEnabled();

	if (isNotSupported) {
		return <MessageComposerAction icon='camera' title='Audio recording is not supported by your browser' disabled />;
	}

	if (!isAllowed) {
		return <MessageComposerAction icon='camera' title='Audio recording is disabled by the server' disabled />;
	}

	return (
		<>
			{open && (
				<Position anchor={positioningRef} placement={'top-middle'}>
					<VideoMessageRecorderDialog rid={rid} tmid={tmid} />
				</Position>
			)}
			<MessageComposerAction ref={positioningRef} icon='camera' onClick={() => toggleOpen()} />
		</>
	);
};

export default VideoMessageRecorder;
