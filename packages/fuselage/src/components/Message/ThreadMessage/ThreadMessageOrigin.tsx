import { styled, Text } from '@tamagui/web';
import type { HTMLAttributes, ReactNode } from 'react';

import { textIconColors } from '../../../Theme';
import { asPublicFrame } from '../../../helpers/asPublicFrame';
import { variantClass } from '../../../helpers/variantClass';
import { boxText, textScale, truncatedText } from '../messageStyles';

const ThreadMessageOriginFrame = styled(Text, {
	render: 'div',
	display: 'block',
	...boxText,
	...textScale('c1'),
	...truncatedText,
	flexShrink: 1,
	cursor: 'pointer',
	color: String(textIconColors['font-info']),

	variants: {
		rcx: { true: variantClass('rcx-message-thread__origin') },
		system: {
			true: variantClass('rcx-message-thread__origin--system', {
				color: String(textIconColors['font-default']),
			}),
		},
	} as const,

	defaultVariants: { rcx: true },
});

export type ThreadMessageOriginProps = {
	children?: ReactNode;
	system?: boolean;
} & HTMLAttributes<HTMLDivElement>;

export default asPublicFrame<ThreadMessageOriginProps>(ThreadMessageOriginFrame);
