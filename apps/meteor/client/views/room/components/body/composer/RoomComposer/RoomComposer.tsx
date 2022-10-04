import { Button, IconButton } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import {
	MessageComposer,
	MessageComposerAction,
	MessageComposerActionsDivider,
	MessageComposerInput,
	MessageComposerToolbar,
	MessageComposerToolbarActions,
	MessageComposerToolbarSubmit,
} from '@rocket.chat/ui-composer';
import React, { ReactElement, RefCallback, useCallback, useEffect, useRef, useState } from 'react';

import type { MessageboxPropTypes } from '../../../../../../../app/ui-message/client/messageBox/messageBox';
import { messageBoxOnEnter } from '../../../../../../../app/ui-message/client/messageBox/messageBoxOnEnter';
import BlazeTemplate from '../../../BlazeTemplate';
import { UserActionIndicator } from '../UserActionIndicator';
import RoomComposerAttachmentsAndShortcutsToolbar from './RoomComposerAttachmentsAndShortcutsToolbar';
import RoomComposerFormattingToolbar from './RoomComposerFormattingToolbar';
import { useAutoGrow } from './hooks/useAutoGrow';

export const RoomComposer = ({
	showFormattingTips,
	onKeyUp,
	onKeyDown,
	onSend,
	openEmojiPicker,
	sendOnEnter,
	useEmojis,
	onInputChanged,
	rid,
	tmid,
}: MessageboxPropTypes): ReactElement => {
	const [value, setValue] = useState('');
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const shadowRef = useRef(null);
	const footerRef = useRef(null);

	const { textAreaStyle, shadowStyle } = useAutoGrow(textareaRef, shadowRef);

	const handleOnSend = useMutableCallback(<E extends Event>(e: E) => {
		onSend(e, { value });
		setValue('');
		const event = new Event('input', { bubbles: true });
		textareaRef.current?.dispatchEvent(event);
	});

	useEffect(() => {
		if (textareaRef.current) {
			textareaRef.current.focus();
		}
	}, [value]);

	const handleComposerRef: RefCallback<HTMLTextAreaElement> = useCallback((ref) => {
		textareaRef.current = ref ?? null;

		if (!ref) {
			return;
		}

		onInputChanged(ref);
	}, []);

	const handleOpenEmojiPicker = useMutableCallback(<E extends Event>(e: E) => {
		openEmojiPicker(e, textareaRef.current);
	});

	useEffect(() => messageBoxOnEnter(sendOnEnter === 'normal', textareaRef.current, handleOnSend), [handleOnSend, onSend, sendOnEnter]);

	return (
		<footer className='rc-message-box footer' ref={footerRef}>
			<BlazeTemplate name='messagePopupConfig' rid={rid} tmid={tmid} getInput={() => textareaRef.current} />
			<MessageComposer>
				<div ref={shadowRef} style={shadowStyle} />
				<MessageComposerInput
					onKeyDown={onKeyDown}
					onKeyUp={onKeyUp}
					ref={handleComposerRef}
					placeholder='Text'
					is='textarea'
					style={textAreaStyle}
					value={value}
					onChange={(e) => setValue(e.currentTarget.value)}
				/>
				<MessageComposerToolbar>
					<MessageComposerToolbarActions>
						{useEmojis && <MessageComposerAction icon='emoji' onClick={handleOpenEmojiPicker} />}
						<MessageComposerAction icon='at' onClick={handleOpenEmojiPicker} />

						{showFormattingTips && (
							<>
								{useEmojis && <MessageComposerActionsDivider />}
								<RoomComposerFormattingToolbar textareaRef={textareaRef} />
							</>
						)}
						<MessageComposerActionsDivider />
						<RoomComposerAttachmentsAndShortcutsToolbar />
					</MessageComposerToolbarActions>
					<MessageComposerToolbarSubmit>
						{/* <Button small>Preview</Button> */}
						<IconButton secondary info small disabled={!value.trim()} onClick={handleOnSend} icon='send' />
					</MessageComposerToolbarSubmit>
				</MessageComposerToolbar>
			</MessageComposer>
			<UserActionIndicator rid={rid} />
		</footer>
	);
};
