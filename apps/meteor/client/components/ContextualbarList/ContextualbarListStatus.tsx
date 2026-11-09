import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type ContextualbarListStatusProps = {
	/** Adds a 12px block padding, as for a loading indicator. */
	spaced?: boolean;
	children: ReactNode;
};

/**
 * A loading indicator or an error shown in place of a contextual bar's list, inset to line up with the list's rows.
 */
const ContextualbarListStatus = ({ spaced, children }: ContextualbarListStatusProps) => (
	<Box paddingInline='x24' paddingBlock={spaced ? 'x12' : undefined}>
		{children}
	</Box>
);

export default ContextualbarListStatus;
