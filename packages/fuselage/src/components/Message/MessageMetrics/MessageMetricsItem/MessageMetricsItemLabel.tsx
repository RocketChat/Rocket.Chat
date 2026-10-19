import { styled, Text, type GetProps } from '@tamagui/web';
import type { HTMLAttributes } from 'react';

import { spacing } from '../../../../styleTokens';
import { withFuselageProvider } from '../../../FuselageProvider/FuselageProvider';
import { plainDiv } from '../../messageStyles';

const MessageMetricsItemLabelFrame = styled(Text, {
	...plainDiv,
	marginInlineStart: spacing('x4'),
});

export type MessageMetricsItemLabelProps = HTMLAttributes<HTMLDivElement>;

const MessageMetricsItemLabel = (props: MessageMetricsItemLabelProps) => (
	<MessageMetricsItemLabelFrame className='rcx-message-metrics__item-label' {...(props as GetProps<typeof MessageMetricsItemLabelFrame>)} />
);

export default withFuselageProvider(MessageMetricsItemLabel);
