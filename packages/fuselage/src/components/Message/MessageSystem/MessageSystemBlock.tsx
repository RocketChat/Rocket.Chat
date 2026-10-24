import { styled, View } from '@tamagui/web';
import type { ReactNode } from 'react';

import { asPublicFrame } from '../../../helpers/asPublicFrame';
import { variantClass } from '../../../helpers/variantClass';

const MessageSystemBlockFrame = styled(View, {
	render: 'div',
	flexDirection: 'row',
	alignItems: 'center',
	flexShrink: 1,
	minWidth: 'auto',
	minHeight: 'auto',

	variants: {
		rcx: { true: variantClass('rcx-message-system__block') },
	} as const,

	defaultVariants: { rcx: true },
});

export type MessageSystemBlockProps = {
	children?: ReactNode;
};

export default asPublicFrame<MessageSystemBlockProps>(MessageSystemBlockFrame);
