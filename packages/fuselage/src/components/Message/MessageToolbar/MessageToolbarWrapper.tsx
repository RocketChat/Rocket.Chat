import { styled, View } from '@tamagui/web';
import type { HTMLAttributes, RefAttributes } from 'react';

export type MessageToolbarWrapperProps = HTMLAttributes<HTMLDivElement> &
	RefAttributes<HTMLDivElement> & {
		/** Shows the toolbar. It stays hidden otherwise: the application decides when a message shows its toolbar. */
		visible?: boolean;
	};

const ToolbarWrapperFrame = styled(View, {});

function MessageToolbarWrapper({ className, visible, children, ...props }: MessageToolbarWrapperProps) {
	return (
		<ToolbarWrapperFrame
			className={['rcx-message-toolbar__wrapper', visible && 'rcx-message-toolbar__wrapper--visible', className].filter(Boolean).join(' ')}
			render={<div {...props} />}
		>
			{children}
		</ToolbarWrapperFrame>
	);
}

export default MessageToolbarWrapper;
