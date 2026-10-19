import { styled, Text, type GetProps } from '@tamagui/web';
import type { HTMLAttributes } from 'react';

import { spacing } from '../../../styleTokens';
import { withFuselageProvider } from '../../FuselageProvider/FuselageProvider';
import { textScale, truncatedText } from '../messageStyles';

const MessageSystemBodyFrame = styled(Text, {
	render: 'div',
	display: 'block',
	...textScale('p2'),
	...truncatedText,
	marginInline: spacing('x2'),
});

export type MessageSystemBodyProps = HTMLAttributes<HTMLDivElement>;

const MessageSystemBody = (props: MessageSystemBodyProps) => (
	<MessageSystemBodyFrame className='rcx-message-system__body' {...(props as GetProps<typeof MessageSystemBodyFrame>)} />
);

export default withFuselageProvider(MessageSystemBody);
