import { Box, Message } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

export type ContextualbarMessageRowProps = Omit<ComponentProps<typeof Box>, 'is'> & {
	/** Leaves room below the row's content, as the discussions list does. */
	spaceBelow?: 'x8';
};

/**
 * A row of a panel's list that shows a message, as the threads and discussions lists do, set 16px below the row's top edge.
 */
const ContextualbarMessageRow = ({ spaceBelow, ...props }: ContextualbarMessageRowProps) => (
	<Box is={Message} {...props} paddingBlockStart='x16' paddingBlockEnd={spaceBelow} />
);

export default ContextualbarMessageRow;
