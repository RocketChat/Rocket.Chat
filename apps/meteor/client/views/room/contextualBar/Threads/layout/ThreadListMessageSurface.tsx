import { Box, Message } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

export type ThreadListMessageSurfaceProps = Omit<ComponentProps<typeof Box>, 'is'>;

/**
 * A thread's row in the threads list: its main message, set 16px below the row's top edge, inside the clickable row.
 */
const ThreadListMessageSurface = ({ className, children, ...props }: ThreadListMessageSurfaceProps) => (
	<Box className={className}>
		<Box paddingBlockStart='x16' is={Message} {...props}>
			{children}
		</Box>
	</Box>
);

export default ThreadListMessageSurface;
