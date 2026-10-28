import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type FilterFieldProps = {
	inset?: boolean;
	children: ReactNode;
};

/**
 * One logs filter, its label over its input, sharing the available width; `inset` keeps it clear of the panel's end edge.
 */
const FilterField = ({ inset = false, children }: FilterFieldProps) => (
	<Box display='flex' flexDirection='column' flexGrow={1} marginInlineEnd={inset ? 'x8' : undefined}>
		{children}
	</Box>
);

export default FilterField;
