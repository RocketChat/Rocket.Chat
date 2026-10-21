import { styled, View } from '@tamagui/web';
import type { HTMLAttributes } from 'react';

import { boxText, truncatedText } from './messageStyles';
import { asPublicFrame } from '../../helpers/asPublicFrame';
import { variantClass } from '../../helpers/variantClass';

const MessageRolesFrame = styled(View, {
	render: 'div',
	...boxText,
	...truncatedText,
	flexDirection: 'row',
	flexShrink: 1,

	variants: {
		rcx: { true: variantClass('rcx-message-header__roles') },
	} as const,

	defaultVariants: { rcx: true },
});

export type MessageRolesProps = HTMLAttributes<HTMLDivElement>;

export default asPublicFrame<MessageRolesProps>(MessageRolesFrame);
