import { styled, Text, type GetProps } from '@tamagui/web';
import type { HTMLAttributes } from 'react';

import { prependClassName } from '../../../helpers/prependClassName';
import { spacing } from '../../../styleTokens';
import { withFuselageProvider } from '../../FuselageProvider/FuselageProvider';
import { plainDiv } from '../messageStyles';

export const MessageMetricsContentItemFrame = styled(Text, {
	...plainDiv,
	display: 'flex',
	marginBlock: spacing('x4'),
});

export type MessageMetricsContentItemProps = HTMLAttributes<HTMLDivElement>;

const MessageMetricsContentItem = ({ className, ...props }: MessageMetricsContentItemProps) => (
	<MessageMetricsContentItemFrame
		className={prependClassName(className, 'rcx-message-metrics__content-item')}
		{...(props as GetProps<typeof MessageMetricsContentItemFrame>)}
	/>
);

export default withFuselageProvider(MessageMetricsContentItem);
