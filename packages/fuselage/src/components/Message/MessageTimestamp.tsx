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
	// secondary-info fails contrast against the hover surface
	color: { 'default': String(textIconColors['font-secondary-info']), 'group-hover/message': String(textIconColors['font-default']) },
});

export type MessageTimestampProps = GetProps<typeof MessageTimestamp>;

export default MessageTimestamp;
