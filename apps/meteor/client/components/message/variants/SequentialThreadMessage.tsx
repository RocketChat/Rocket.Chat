import { memo } from 'react';

import StatusIndicators from '../StatusIndicators';
import ThreadMessageFrame from './thread/ThreadMessageFrame';
import type { ThreadMessageFrameProps } from './thread/ThreadMessageFrame';

export type SequentialThreadMessageProps = Omit<ThreadMessageFrameProps, 'leading' | 'header'>;

/** A thread message that continues the group above it: no avatar nor header, its status indicators on the left */
const SequentialThreadMessage = ({ message, ...props }: SequentialThreadMessageProps) => (
	<ThreadMessageFrame message={message} leading={<StatusIndicators message={message} />} {...props} />
);

export default memo(SequentialThreadMessage);
