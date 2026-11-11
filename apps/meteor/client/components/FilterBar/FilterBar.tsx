import { Box } from '@rocket.chat/fuselage';
import type { ReactNode, SubmitEvent } from 'react';
import { createContext, useContext } from 'react';

export type FilterBarProps = {
	/** One row that never wraps, for narrow panels such as a contextual bar section */
	compact?: boolean;
	children: ReactNode;
};

const CompactContext = createContext(false);

export const useIsCompactFilterBar = () => useContext(CompactContext);

const preventSubmit = (event: SubmitEvent<HTMLFormElement>) => event.preventDefault();

/**
 * The row of search, filters and actions above a list. It wraps onto more rows when they don't fit.
 */
const FilterBar = ({ compact = false, children }: FilterBarProps) => (
	<CompactContext.Provider value={compact}>
		<Box
			is='form'
			onSubmit={preventSubmit}
			marginBlock={compact ? undefined : 'x16'}
			flexGrow={compact ? 1 : undefined}
			display='flex'
			flexWrap={compact ? 'nowrap' : 'wrap'}
			alignItems='center'
			gap='x8'
		>
			{children}
		</Box>
	</CompactContext.Provider>
);

export default FilterBar;
