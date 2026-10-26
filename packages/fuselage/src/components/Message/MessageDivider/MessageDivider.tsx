import { styled, Text, View } from '@tamagui/web';
import type { HTMLAttributes, ReactNode } from 'react';

import { strokeColors, surfaceColors, textIconColors } from '../../../Theme';
import { prependClassName } from '../../../helpers/prependClassName';
import { toCSSValue } from '../../../helpers/toCSSValue';
import { borderWidth, spacing } from '../../../styleTokens';
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

// Stands in for the bar's former `::after` line
const MessageDividerLine = styled(View, {
	render: 'span',
	flexGrow: 1,
	height: toCSSValue('--rcx-message-divider-size', borderWidth('default')),
	backgroundColor: toCSSValue('--rcx-message-divider-background-color', strokeColors['stroke-extra-light']),

	variants: {
		unread: {
			true: {
				backgroundColor: toCSSValue('--rcx-message-divider-background-color-unread', strokeColors['stroke-error']),
			},
		},
	} as const,
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
} & HTMLAttributes<HTMLDivElement>;

const MessageDivider = ({ children, unreadLabel, className, ...props }: MessageDividerProps) => (
	<div
		role='separator'
		className={prependClassName(className, !unreadLabel ? 'rcx-message-divider' : 'rcx-message-divider rcx-message-divider--unread')}
		{...props}
	>
		{children && (
			<>
				<MessageDividerBar className='rcx-message-divider__bar'>
					<MessageDividerLine aria-hidden unread={!!unreadLabel} />
				</MessageDividerBar>
				<MessageDividerWrapper className='rcx-message-divider__wrapper'>{children}</MessageDividerWrapper>{' '}
			</>
		)}
		<MessageDividerBar className='rcx-message-divider__bar'>
			{unreadLabel && (
				<MessageDividerUnreadWrapper className='rcx-message-divider__wrapper--unread'>{unreadLabel}</MessageDividerUnreadWrapper>
			)}
			<MessageDividerLine aria-hidden unread={!!unreadLabel} />
		</MessageDividerBar>
	</div>
);

export default withFuselageProvider(MessageDivider);
