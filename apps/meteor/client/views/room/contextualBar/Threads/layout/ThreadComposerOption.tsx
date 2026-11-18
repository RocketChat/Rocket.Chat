import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type ThreadComposerOptionProps = {
	children: ReactNode;
};

/**
 * A checkbox and its label under the thread's composer, on one line that may shrink to the composer's width.
 */
const ThreadComposerOption = ({ children }: ThreadComposerOptionProps) => (
	<Box display='flex' alignItems='center' minWidth={0} gap='x8' paddingBlock='x8'>
		{children}
	</Box>
);

export default ThreadComposerOption;
