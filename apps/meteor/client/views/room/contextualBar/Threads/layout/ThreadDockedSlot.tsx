import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type ThreadDockedSlotProps = {
	children: ReactNode;
};

/**
 * The space the thread view fills inside the contextual bar when it is not expanded over the room.
 */
const ThreadDockedSlot = ({ children }: ThreadDockedSlotProps) => (
	<Box flexGrow={1} position='relative'>
		{children}
	</Box>
);

export default ThreadDockedSlot;
