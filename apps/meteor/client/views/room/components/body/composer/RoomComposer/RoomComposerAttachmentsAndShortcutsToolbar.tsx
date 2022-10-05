import { MessageComposerAction } from '@rocket.chat/ui-composer';
import React, { memo, ReactElement } from 'react';

import AudioMessageRecorder from '../AudioMessageRecorder';

const RoomComposerAttachmentsAndShortcutsToolbar = (): ReactElement => (
	<>
		<AudioMessageRecorder />
		<MessageComposerAction icon='video' />
		<MessageComposerAction icon='plus' />
	</>
);

export default memo(RoomComposerAttachmentsAndShortcutsToolbar);
