import { styled, View } from '@tamagui/web';
import type { ReactNode } from 'react';

import { asPublicFrame } from '../../../helpers/asPublicFrame';
import { variantClass } from '../../../helpers/variantClass';
import { size, spacing } from '../../../styleTokens';
import { boxText, truncatedText } from '../messageStyles';

const ThreadMessageContainerFrame = styled(View, {
	render: 'div',
	...boxText,
	...truncatedText,
	flexDirection: 'row',
	flexShrink: 1,
	width: size('full'),
	margin: spacing('x4'),

	variants: {
		rcx: { true: variantClass('rcx-message-thread__container') },
	} as const,

	defaultVariants: { rcx: true },
});

export type ThreadMessageContainerProps = {
	children?: ReactNode;
};

export default asPublicFrame<ThreadMessageContainerProps>(ThreadMessageContainerFrame);
