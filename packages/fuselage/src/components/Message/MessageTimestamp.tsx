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
	// The hover color is in `Messages.styles.css`: a group clause would subscribe every timestamp to its message's hover
	color: String(textIconColors['font-secondary-info']),
});

export type MessageTimestampProps = HTMLAttributes<HTMLSpanElement>;

const MessageTimestamp = (props: MessageTimestampProps) => (
	<MessageTimestampFrame className='rcx-message-header__time' {...(props as GetProps<typeof MessageTimestampFrame>)} />
);

export default withFuselageProvider(MessageTimestamp);
