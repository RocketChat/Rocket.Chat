import type { HTMLAttributes, RefAttributes } from 'react';

export type MessageToolbarWrapperProps = HTMLAttributes<HTMLDivElement> &
	RefAttributes<HTMLDivElement> & {
		visible?: boolean;
	};

function MessageToolbarWrapper({ className, visible, ...props }: MessageToolbarWrapperProps) {
	return (
		<div
			className={['rcx-box rcx-box--full rcx-message-toolbar__wrapper', visible && 'rcx-message-toolbar__wrapper--visible', className]
				.filter(Boolean)
				.join(' ')}
			{...props}
		/>
	);
}

export default MessageToolbarWrapper;
