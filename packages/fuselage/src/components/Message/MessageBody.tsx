import { styled, Text, type GetProps } from '@tamagui/web';
import type { HTMLAttributes } from 'react';

import { MessageContext } from './MessageContext';
import { lineClamp, textScale } from './messageStyles';
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
	transition: 'opacity 0.3s linear',
	wordBreak: 'break-word',
	color: String(textIconColors['font-default']),

	variants: {
		pending: {
			true: {
				opacity: 0.4,
			},
		},
		clamp: {
			2: lineClamp(2),
			3: lineClamp(3),
			// Clamped at 3, as it always was
			4: lineClamp(3),
		},
	} as const,
});

export type MessageBodyProps = HTMLAttributes<HTMLDivElement> & {
	clamp?: 2 | 3 | 4;
};

function MessageBody({ clamp, className, ...props }: MessageBodyProps) {
	const { pending } = MessageContext.useStyledContext();

	return (
		<MessageBodyFrame
			pending={pending}
			clamp={clamp}
			className={prependClassName(
				className,
				['rcx-message-body', clamp && `rcx-message-body--clamp rcx-message-body--clamp-${clamp}`].filter(Boolean).join(' '),
			)}
			{...(props as GetProps<typeof MessageBodyFrame>)}
		/>
	);
}

export default withFuselageProvider(MessageBody);
