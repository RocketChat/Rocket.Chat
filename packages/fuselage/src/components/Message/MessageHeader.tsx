import { styled, View, type GetProps } from '@tamagui/web';
import type { HTMLAttributes } from 'react';

import { boxText } from './messageStyles';
import { prependClassName } from '../../helpers/prependClassName';
import { spacing } from '../../styleTokens';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

const MessageHeaderFrame = styled(View, {
	render: 'div',
	...boxText,
	flexDirection: 'row',
	flexGrow: 0,
	flexShrink: 1,
	minWidth: 1,
	marginBlock: spacing('x2'),
});

const MessageHeaderWrapper = styled(View, {
	render: 'div',
	...boxText,
	flexDirection: 'row',
	alignItems: 'center',
	flexGrow: 1,
	flexShrink: 1,
	minWidth: 1,
	marginBlock: spacing('neg-x4'),
	marginInline: spacing('neg-x2'),
});

export type MessageHeaderProps = HTMLAttributes<HTMLDivElement>;

const MessageHeader = ({ children, className, ...props }: MessageHeaderProps) => (
	<MessageHeaderFrame className={prependClassName(className, 'rcx-message-header')} {...(props as GetProps<typeof MessageHeaderFrame>)}>
		<MessageHeaderWrapper className='rcx-message-header__wrapper'>{children}</MessageHeaderWrapper>
	</MessageHeaderFrame>
);

export default withFuselageProvider(MessageHeader);
