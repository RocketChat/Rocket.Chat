import { styled, Text } from '@tamagui/web';

import { textIconColors } from '../../../Theme';
import { asPublicFrame } from '../../../helpers/asPublicFrame';
import { variantClass } from '../../../helpers/variantClass';
import type { MessageNameProps } from '../MessageName';
import { boxText, textScale, truncatedText } from '../messageStyles';

const MessageSystemNameFrame = styled(Text, {
	render: 'span',
	...boxText,
	...textScale('p2b'),
	...truncatedText,
	flexShrink: 0,
	color: String(textIconColors['font-titles-labels']),

	variants: {
		rcx: { true: variantClass('rcx-message-system__name') },
	} as const,

	defaultVariants: { rcx: true },
});

export type MessageSystemNameProps = MessageNameProps;

export default asPublicFrame<MessageSystemNameProps>(MessageSystemNameFrame);
