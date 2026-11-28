import type { ReactNode } from 'react';
import { memo } from 'react';

import { FilterBar, FilterBarSearch, type FilterBarSearchProps } from './FilterBar';

export type FilterByTextProps = FilterBarSearchProps & {
	children?: ReactNode;
};

/**
 * A filter bar holding a text search, followed by whatever `children` adds to it.
 */
const FilterByText = ({ children, ...props }: FilterByTextProps) => (
	<FilterBar>
		<FilterBarSearch {...props} />
		{children}
	</FilterBar>
);

export default memo(FilterByText);
