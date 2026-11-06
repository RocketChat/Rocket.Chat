import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';
import { Children } from 'react';

import { useIsCompactFilterBar } from './FilterBar';

export type FilterBarFiltersProps = {
	children: ReactNode;
};

/**
 * The filters of a filter bar. They move to the next row together, never one by one, and share it in equal widths.
 */
const FilterBarFilters = ({ children }: FilterBarFiltersProps) => {
	const compact = useIsCompactFilterBar();

	return (
		<Box display='flex' flexWrap={compact ? 'nowrap' : 'wrap'} flexGrow={compact ? 0 : 1} flexShrink={compact ? 0 : 1} gap='x8'>
			{Children.toArray(children).map((child, index) => (
				<Box
					key={index}
					flexGrow={compact ? 0 : 1}
					flexShrink={1}
					flexBasis={compact ? 'x144' : 'x200'}
					minWidth={compact ? 'x144' : 'x200'}
				>
					{child}
				</Box>
			))}
		</Box>
	);
};

export default FilterBarFilters;
