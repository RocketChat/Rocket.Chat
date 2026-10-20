import { styled, Text, type GetProps } from '@tamagui/web';
import type { HTMLAttributes } from 'react';

import { boxText, textScale, truncatedText } from './messageStyles';
import { textIconColors } from '../../Theme';
import { spacing } from '../../styleTokens';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

const MessageTimestampFrame = styled(Text, {
	render: 'span',
	...boxText,
	...textScale('c1'),
	...truncatedText,
	flexShrink: 0,
	marginInline: spacing('x2'),
	// secondary-info fails contrast against the hover surface
	color: { 'default': String(textIconColors['font-secondary-info']), 'group-hover/message': String(textIconColors['font-default']) },
});

export type MessageTimestampProps = HTMLAttributes<HTMLSpanElement>;

const MessageTimestamp = (props: MessageTimestampProps) => (
	<MessageTimestampFrame className='rcx-message-header__time' {...(props as GetProps<typeof MessageTimestampFrame>)} />
);

export default withFuselageProvider(MessageTimestamp);
