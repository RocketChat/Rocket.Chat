import { styled, Text, type GetProps } from '@tamagui/web';

import { boxText, textScale, truncatedText } from './messageStyles';
import { textIconColors } from '../../Theme';

const MessageName = styled(Text, {
	className: 'rcx-message-header__name',
	displayName: 'MessageName',
	render: 'span',
	...boxText,
	...textScale('h5'),
	...truncatedText,
	flexShrink: 1,
	color: String(textIconColors['font-titles-labels']),
});

export type MessageNameProps = GetProps<typeof MessageName>;

export default MessageName;
