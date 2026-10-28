import { Box, Message } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

export type DiscussionsListItemSurfaceProps = Omit<ComponentProps<typeof Box>, 'is'>;

/**
 * A discussion's row in the discussions list, laid out as a message with room above and below it.
 */
const DiscussionsListItemSurface = (props: DiscussionsListItemSurfaceProps) => (
	<Box is={Message} {...props} paddingBlockStart='x16' paddingBlockEnd='x8' />
);

export default DiscussionsListItemSurface;
