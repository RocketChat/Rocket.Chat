import { styled, View, type GetProps } from '@tamagui/web';
import type { HTMLAttributes, RefAttributes } from 'react';

import { MessageToolbarContext } from './MessageToolbarContext';
import { withFuselageProvider } from '../../FuselageProvider/FuselageProvider';
import { boxText } from '../messageStyles';

const MessageToolbarWrapperFrame = styled(View, {
	render: 'div',
	...boxText,
	display: { 'default': 'none', 'group-hover/message': 'inline-block', 'group-focus-within/message': 'inline-block' },
	flexShrink: 1,

	variants: {
		visible: {
			true: {
				display: 'inline-block',
			},
		},
	} as const,
});

export type MessageToolbarWrapperProps = HTMLAttributes<HTMLDivElement> &
	RefAttributes<HTMLDivElement> & {
		visible?: boolean;
	};

function MessageToolbarWrapper({ className, visible, children, ...props }: MessageToolbarWrapperProps) {
	return (
		<MessageToolbarWrapperFrame
			visible={visible}
			className={['rcx-message-toolbar__wrapper', visible && 'rcx-message-toolbar__wrapper--visible', className].filter(Boolean).join(' ')}
			{...(props as GetProps<typeof MessageToolbarWrapperFrame>)}
		>
			<MessageToolbarContext.Provider visible={!!visible}>{children}</MessageToolbarContext.Provider>
		</MessageToolbarWrapperFrame>
	);
}

export default withFuselageProvider(MessageToolbarWrapper);
