import { styled, Text } from '@tamagui/web';
import type { ReactNode } from 'react';

import { textIconColors } from '../../../Theme';
import { asPublicFrame } from '../../../helpers/asPublicFrame';
import { variantClass } from '../../../helpers/variantClass';
import { textScale } from '../messageStyles';

const MessageStatusIndicatorTextFrame = styled(Text, {
	'render': 'span',
	'aria-hidden': true,
	'whiteSpace': 'nowrap',
	'wordWrap': 'inherit',
	'color': String(textIconColors['font-secondary-info']),
	...textScale('c1'),

	'variants': {
		rcx: { true: variantClass('rcx-message-status-indicator__text') },
	} as const,

	'defaultVariants': { rcx: true },
});

export type MessageStatusIndicatorTextProps = {
	children: ReactNode;
};

export default asPublicFrame<MessageStatusIndicatorTextProps>(MessageStatusIndicatorTextFrame);
