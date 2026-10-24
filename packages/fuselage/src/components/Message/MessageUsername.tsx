import { styled, Text } from '@tamagui/web';
import type { HTMLAttributes } from 'react';

import { boxText, textScale, truncatedText } from './messageStyles';
import { textIconColors } from '../../Theme';
import { asPublicFrame } from '../../helpers/asPublicFrame';
import { variantClass } from '../../helpers/variantClass';

const MessageUsernameFrame = styled(Text, {
	render: 'span',
	...boxText,
	...textScale('p2'),
	...truncatedText,
	flexShrink: 1,
	color: String(textIconColors['font-default']),

	variants: {
		rcx: { true: variantClass('rcx-message-header__username') },
	} as const,

	defaultVariants: { rcx: true },
});

export type MessageUsernameProps = HTMLAttributes<HTMLSpanElement>;

export default asPublicFrame<MessageUsernameProps>(MessageUsernameFrame);
