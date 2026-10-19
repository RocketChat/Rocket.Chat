import { styled, Text, type GetProps } from '@tamagui/web';
import type { HTMLAttributes } from 'react';

import { textScale } from './messageStyles';
import { textIconColors } from '../../Theme';
import { prependClassName } from '../../helpers/prependClassName';
import { spacing } from '../../styleTokens';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

const MessageBodyFrame = styled(Text, {
	render: 'div',
	display: 'block',
	whiteSpace: 'inherit',
	...textScale('p2'),
	overflow: 'hidden',
	flexShrink: 1,
	marginBlock: spacing('x2'),
	opacity: 1,
	color: String(textIconColors['font-default']),
});

export type MessageBodyProps = HTMLAttributes<HTMLDivElement> & {
	clamp?: 2 | 3 | 4;
};

const MessageBody = ({ clamp, className, ...props }: MessageBodyProps) => (
	<MessageBodyFrame
		className={prependClassName(
			className,
			['rcx-message-body', clamp && `rcx-message-body--clamp rcx-message-body--clamp-${clamp}`].filter(Boolean).join(' '),
		)}
		{...(props as GetProps<typeof MessageBodyFrame>)}
	/>
);

export default withFuselageProvider(MessageBody);
