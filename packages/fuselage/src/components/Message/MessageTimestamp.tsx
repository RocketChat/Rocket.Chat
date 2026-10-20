import { styled, Text, type GetProps } from '@tamagui/web';

import { boxText, textScale, truncatedText } from './messageStyles';
import { textIconColors } from '../../Theme';
import { spacing } from '../../styleTokens';

const MessageTimestamp = styled(Text, {
	className: 'rcx-message-header__time',
	displayName: 'MessageTimestamp',
	render: 'span',
	...boxText,
	...textScale('c1'),
	...truncatedText,
	flexShrink: 0,
	marginInline: spacing('x2'),
	// The hover color is in `Messages.styles.css`: a group clause would subscribe every timestamp to its message's hover
	color: String(textIconColors['font-secondary-info']),
});

export type MessageTimestampProps = GetProps<typeof MessageTimestamp>;

export default MessageTimestamp;
