import type { HTMLAttributes, RefAttributes } from 'react';

export type MessageToolbarWrapperProps = HTMLAttributes<HTMLDivElement> &
	RefAttributes<HTMLDivElement> & {
		/** Keeps the toolbar shown while the message isn't hovered or focused, as while one of its menus is open. */
		visible?: boolean;
	};

/**
 * Shows a message's toolbar over the top edge of the row while the message is hovered or holds focus.
 */
function MessageToolbarWrapper({ className, visible, ...props }: MessageToolbarWrapperProps) {
	return (
		<div
			className={['rcx-message-toolbar__wrapper', visible && 'rcx-message-toolbar__wrapper--visible', className].filter(Boolean).join(' ')}
			{...props}
		/>
	);
}

export default MessageToolbarWrapper;
