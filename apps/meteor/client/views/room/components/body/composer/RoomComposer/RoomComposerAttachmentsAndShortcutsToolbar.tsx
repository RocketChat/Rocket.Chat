import { MessageComposerAction } from '@rocket.chat/ui-composer';
import React, { memo, ReactElement } from 'react';

// import AudioMessageRecorder from '../AudioMessageRecorder';
// import VideoMessageRecorder from '../VideoMessageRecorder';

import VideoMessageRecorder from '../VideoMessageRecorder/VideoMessageRecorder';

const RoomComposerAttachmentsAndShortcutsToolbar = (): ReactElement => (
	<>
		{/* <AudioMessageRecorder /> */}
		<VideoMessageRecorder />
		{/* <MessageComposerAction icon='video' /> */}
		<MessageComposerAction icon='plus' />
	</>
);

export default memo(RoomComposerAttachmentsAndShortcutsToolbar);
