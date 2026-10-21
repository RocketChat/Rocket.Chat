import { styled, Text } from '@tamagui/web';
import type { ReactNode } from 'react';

import { textIconColors } from '../../../Theme';
import { asPublicFrame } from '../../../helpers/asPublicFrame';
import { variantClass } from '../../../helpers/variantClass';
import { boxText, truncatedText } from '../messageStyles';

const ThreadMessageBodyFrame = styled(Text, {
	render: 'div',
	display: 'block',
	...boxText,
	...truncatedText,
	flexShrink: 1,
	color: String(textIconColors['font-default']),

	variants: {
		rcx: { true: variantClass('rcx-message-thread__message') },
	} as const,

	defaultVariants: { rcx: true },
});

export type ThreadMessageBodyProps = {
	children?: ReactNode;
};

export default asPublicFrame<ThreadMessageBodyProps>(ThreadMessageBodyFrame);
