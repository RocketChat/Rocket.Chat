import { styled, Text } from '@tamagui/web';
import type { ReactNode } from 'react';

import { surfaceColors, textIconColors } from '../../../Theme';
import { toCSSValue } from '../../../helpers/toCSSValue';
import { spacing } from '../../../styleTokens';
import { withFuselageProvider } from '../../FuselageProvider/FuselageProvider';
import { plainDiv } from '../messageStyles';

const messageBackgroundColor = toCSSValue('--rcx-message-background-color', surfaceColors['surface-room']);

const MessageDividerBar = styled(Text, {
	...plainDiv,
	display: 'flex',
	justifyContent: 'flex-end',
	alignItems: 'center',
	flexGrow: 1,
});

const MessageDividerWrapper = styled(Text, {
	...plainDiv,
	marginBlock: spacing('x8'),
	paddingInline: spacing('x8'),
	backgroundColor: messageBackgroundColor,
});

const MessageDividerUnreadWrapper = styled(Text, {
	...plainDiv,
	position: 'absolute',
	zIndex: 1,
	order: 1,
	paddingInlineStart: spacing('x8'),
	color: toCSSValue('--rcx-message-divider-color-unread', textIconColors['font-danger']),
	backgroundColor: messageBackgroundColor,
});

export type MessageDividerProps = {
	children?: ReactNode;
	unreadLabel?: string;
};

const MessageDivider = ({ children, unreadLabel, ...props }: MessageDividerProps) => (
	<div role='separator' className={!unreadLabel ? 'rcx-message-divider' : 'rcx-message-divider rcx-message-divider--unread'} {...props}>
		{children && (
			<>
				<MessageDividerBar className='rcx-message-divider__bar' />
				<MessageDividerWrapper className='rcx-message-divider__wrapper'>{children}</MessageDividerWrapper>{' '}
			</>
		)}
		<MessageDividerBar className='rcx-message-divider__bar'>
			{unreadLabel && (
				<MessageDividerUnreadWrapper className='rcx-message-divider__wrapper--unread'>{unreadLabel}</MessageDividerUnreadWrapper>
			)}
		</MessageDividerBar>
	</div>
);

export default withFuselageProvider(MessageDivider);
