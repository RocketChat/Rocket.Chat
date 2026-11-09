import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type ContextualbarInsetProps = {
	/** Also keeps clear of the header and of the content around it, as a loading indicator or an error in a list's place does. */
	block?: 'x12' | 'x16' | 'x24';
	children: ReactNode;
};

/**
 * Content in a flush `ContextualbarContent` that is not a list's row, put back on the 24px edge the content dropped.
 */
const ContextualbarInset = ({ block, children }: ContextualbarInsetProps) => (
	<Box paddingInline='x24' paddingBlock={block}>
		{children}
	</Box>
);

export default ContextualbarInset;
