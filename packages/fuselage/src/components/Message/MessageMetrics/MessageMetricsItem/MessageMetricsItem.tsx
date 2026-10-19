import { styled, Text, type GetProps } from '@tamagui/web';
import type { HTMLAttributes } from 'react';

import { textIconColors } from '../../../../Theme';
import { prependClassName } from '../../../../helpers/prependClassName';
import { spacing } from '../../../../styleTokens';
import { withFuselageProvider } from '../../../FuselageProvider/FuselageProvider';
import { plainDiv, textScale } from '../../messageStyles';

const MessageMetricsItemFrame = styled(Text, {
	...plainDiv,
	...textScale('micro'),
	display: 'flex',
	justifyContent: 'center',
	alignItems: 'center',
	marginInline: spacing('x4'),
	color: String(textIconColors['font-default']),
});

export type MessageMetricsItemProps = HTMLAttributes<HTMLDivElement>;

const MessageMetricsItem = ({ className, ...props }: MessageMetricsItemProps) => (
	<MessageMetricsItemFrame
		className={prependClassName(className, 'rcx-message-metrics__item')}
		{...(props as GetProps<typeof MessageMetricsItemFrame>)}
	/>
);

export default withFuselageProvider(MessageMetricsItem);
