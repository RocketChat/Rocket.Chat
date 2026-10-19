import { styled, Text, type GetProps } from '@tamagui/web';
import type { HTMLAttributes } from 'react';

import { prependClassName } from '../../../../helpers/prependClassName';
import { spacing } from '../../../../styleTokens';
import { withFuselageProvider } from '../../../FuselageProvider/FuselageProvider';
import { plainDiv } from '../../messageStyles';

const MessageMetricsItemAvatarRowContentFrame = styled(Text, {
	...plainDiv,
	marginInline: spacing('x2'),
});

export type MessageMetricsItemAvatarRowContentProps = HTMLAttributes<HTMLDivElement>;

const MessageMetricsItemAvatarRowContent = ({ className, ...props }: MessageMetricsItemAvatarRowContentProps) => (
	<MessageMetricsItemAvatarRowContentFrame
		className={prependClassName(className, 'rcx-message-metrics__avatar-row__content')}
		{...(props as GetProps<typeof MessageMetricsItemAvatarRowContentFrame>)}
	/>
);

export default withFuselageProvider(MessageMetricsItemAvatarRowContent);
