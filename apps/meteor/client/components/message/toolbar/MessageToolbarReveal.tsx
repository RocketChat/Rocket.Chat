import { MessageToolbarWrapper } from '@rocket.chat/fuselage';
import type { ReactNode, Ref } from 'react';

import './MessageToolbarReveal.css';

/** The class of the message row a toolbar belongs to: pointing at that row, or focusing inside it, reveals the toolbar. */
export const messageToolbarScope = 'message-toolbar-scope';

export type MessageToolbarRevealProps = {
	children?: ReactNode;
	ref?: Ref<HTMLDivElement>;
	/** Keeps the toolbar shown while the pointer is away from its message, as when one of its menus is open. */
	visible?: boolean;
};

function MessageToolbarReveal({ children, ref, visible }: MessageToolbarRevealProps) {
	return (
		<MessageToolbarWrapper ref={ref} visible={visible} className={visible ? undefined : 'message-toolbar-reveal'}>
			{children}
		</MessageToolbarWrapper>
	);
}

export default MessageToolbarReveal;
