import { Button } from '@rocket.chat/fuselage';
import {
	MessageComposer,
	MessageComposerAction,
	MessageComposerActionsDivider,
	MessageComposerInput,
	MessageComposerToolbar,
	MessageComposerToolbarActions,
	MessageComposerToolbarSubmit,
} from '@rocket.chat/ui-composer';
import React, { ReactElement, useRef } from 'react';

import { useAutogrow } from './hooks/useAutogrow';

export const RoomComposer = (): ReactElement => {
	const textareaRef = useRef(null);
	const shadowRef = useRef(null);

	const { textAreaStyle, shadowStyle } = useAutogrow(textareaRef, shadowRef);

	return (
		<footer className='rc-message-box footer'>
			<MessageComposer>
				<div ref={shadowRef} style={shadowStyle} />
				<MessageComposerInput ref={textareaRef} placeholder='Text' is='textarea' style={textAreaStyle} />
				<MessageComposerToolbar>
					<MessageComposerToolbarActions>
						<MessageComposerAction icon='emoji' />
						<MessageComposerActionsDivider />
						<MessageComposerAction icon='bold' />
						<MessageComposerAction icon='italic' />
						<MessageComposerAction icon='underline' />
						<MessageComposerAction icon='strike' />
						<MessageComposerAction icon='code' />
						<MessageComposerAction icon='arrow-return' />
						<MessageComposerActionsDivider />
						<MessageComposerAction icon='mic' />
						<MessageComposerAction icon='clip' />
					</MessageComposerToolbarActions>
					<MessageComposerToolbarSubmit>
						<Button small>Preview</Button>
						<Button primary small>
							Send
						</Button>
					</MessageComposerToolbarSubmit>
				</MessageComposerToolbar>
			</MessageComposer>
		</footer>
	);
};
