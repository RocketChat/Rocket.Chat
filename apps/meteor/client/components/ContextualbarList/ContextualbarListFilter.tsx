import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type ContextualbarListFilterProps = {
	children: ReactNode;
};

/**
 * The fixed-width filter that follows the search input in a contextual bar's section.
 */
const ContextualbarListFilter = ({ children }: ContextualbarListFilterProps) => (
	<Box width='x144' marginInlineStart='x8'>
		{children}
	</Box>
);

export default ContextualbarListFilter;
