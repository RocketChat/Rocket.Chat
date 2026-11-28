import type { HTMLAttributes, RefAttributes } from 'react';

export type MessageToolbarWrapperProps = HTMLAttributes<HTMLDivElement> &
	RefAttributes<HTMLDivElement> & {
		/** Shows the toolbar. It stays hidden otherwise: the application decides when a message shows its toolbar. */
		visible?: boolean;
	};

function MessageToolbarWrapper({ className, visible, ...props }: MessageToolbarWrapperProps) {
	return (
		<div
			className={['rcx-message-toolbar__wrapper', visible && 'rcx-message-toolbar__wrapper--visible', className].filter(Boolean).join(' ')}
			{...props}
		/>
	);
}

export default MessageToolbarWrapper;
