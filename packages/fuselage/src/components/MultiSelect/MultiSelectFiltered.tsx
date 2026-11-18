import type { Dispatch, SetStateAction } from 'react';
import { useState } from 'react';

import type { IconProps } from '../Icon';
import type { MultiSelectProps } from './MultiSelect';
import MultiSelect from './MultiSelect';
import MultiSelectFilteredAnchor from './MultiSelectFilteredAnchor';
import { MultiSelectFilteredContext } from './MultiSelectFilteredContext';

export type MultiSelectFilteredProps = MultiSelectProps & {
	/** The text typed into the select, for a caller that keeps it; the select keeps its own otherwise. */
	filter?: string;
	/** Called with the text as the user types it, and with an empty string once an option is picked. */
	setFilter?: Dispatch<SetStateAction<string>>;
	addonIcon?: IconProps['name'];
};

/**
 * A `MultiSelect` the user can type into, to narrow its options down to those whose label contains the text.
 */

function MultiSelectFiltered({ options, placeholder, filter: propFilter, setFilter: propSetFilter, ...props }: MultiSelectFilteredProps) {
	const [filter, setFilter] = useState('');

	return (
		<MultiSelectFilteredContext.Provider
			value={{
				placeholder,
				filter: propFilter || filter,
				setFilter: propSetFilter || setFilter,
			}}
		>
			<MultiSelect
				{...props}
				filter={propFilter || filter}
				setFilter={propSetFilter || setFilter}
				options={options}
				anchor={MultiSelectFilteredAnchor}
			/>
		</MultiSelectFilteredContext.Provider>
	);
}

export default MultiSelectFiltered;
