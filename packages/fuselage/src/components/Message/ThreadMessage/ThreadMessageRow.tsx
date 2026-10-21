import { styled, View } from '@tamagui/web';
import type { HTMLAttributes } from 'react';

import { asPublicFrame } from '../../../helpers/asPublicFrame';
import { variantClass } from '../../../helpers/variantClass';
import { size } from '../../../styleTokens';
import { boxText, truncatedText } from '../messageStyles';

const ThreadMessageRowFrame = styled(View, {
	render: 'div',
	...boxText,
	...truncatedText,
	flexDirection: 'row',
	alignItems: 'center',
	flexShrink: 1,
	width: size('full'),
	cursor: 'pointer',

	variants: {
		rcx: { true: variantClass('rcx-message-thread__row') },
	} as const,

	defaultVariants: { rcx: true },
});

export type ThreadMessageRowProps = HTMLAttributes<HTMLDivElement>;

export default asPublicFrame<ThreadMessageRowProps>(ThreadMessageRowFrame);
