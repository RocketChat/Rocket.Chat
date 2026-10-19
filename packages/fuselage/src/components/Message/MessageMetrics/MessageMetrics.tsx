import { styled, Text, type GetProps } from '@tamagui/web';
import type { HTMLAttributes } from 'react';

import MessageMetricsContentItem from './MessageMetricsContentItem';
import { spacing } from '../../../styleTokens';
import { withFuselageProvider } from '../../FuselageProvider/FuselageProvider';
import { plainDiv } from '../messageStyles';

const MessageMetricsContentWrapper = styled(Text, {
	...plainDiv,
	display: 'flex',
	marginInline: spacing('neg-x4'),
});

export type MessageMetricsProps = HTMLAttributes<HTMLDivElement>;

const MessageMetrics = (props: MessageMetricsProps) => (
	<MessageMetricsContentItem>
		<MessageMetricsContentWrapper
			className='rcx-message-metrics__content-wrapper'
			{...(props as GetProps<typeof MessageMetricsContentWrapper>)}
		/>
	</MessageMetricsContentItem>
);

export default withFuselageProvider(MessageMetrics);
