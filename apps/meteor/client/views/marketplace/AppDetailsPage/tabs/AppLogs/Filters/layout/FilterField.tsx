import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type FilterFieldProps = {
	children: ReactNode;
};

/**
 * One logs filter in a modal or a side panel, its label over its input, kept clear of the end edge.
 */
const FilterField = ({ children }: FilterFieldProps) => (
	<Box display='flex' flexDirection='column' flexGrow={1} marginInlineEnd='x8'>
		{children}
	</Box>
);

export default FilterField;
