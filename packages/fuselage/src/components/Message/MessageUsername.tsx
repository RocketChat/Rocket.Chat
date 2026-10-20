import { styled, Text, type GetProps } from '@tamagui/web';

import { boxText, textScale, truncatedText } from './messageStyles';
import { textIconColors } from '../../Theme';

const MessageUsername = styled(Text, {
	className: 'rcx-message-header__username',
	displayName: 'MessageUsername',
	render: 'span',
	...boxText,
	...textScale('p2'),
	...truncatedText,
	flexShrink: 1,
	color: String(textIconColors['font-default']),
});

export type MessageUsernameProps = GetProps<typeof MessageUsername>;

export default MessageUsername;
