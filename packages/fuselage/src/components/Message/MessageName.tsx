import { styled, Text } from '@tamagui/web';
import type { HTMLAttributes } from 'react';

import { boxText, textScale, truncatedText } from './messageStyles';
import { textIconColors } from '../../Theme';
import { asPublicFrame } from '../../helpers/asPublicFrame';
import { variantClass } from '../../helpers/variantClass';

const MessageNameFrame = styled(Text, {
	render: 'span',
	...boxText,
	...textScale('h5'),
	...truncatedText,
	flexShrink: 1,
	color: String(textIconColors['font-titles-labels']),

	variants: {
		rcx: { true: variantClass('rcx-message-header__name') },
	} as const,

	defaultVariants: { rcx: true },
});

export type MessageNameProps = HTMLAttributes<HTMLSpanElement>;

export default asPublicFrame<MessageNameProps>(MessageNameFrame);
