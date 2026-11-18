import type { Dispatch, SetStateAction } from 'react';
import { useState } from 'react';

import type { IconProps } from '..';
import SelectFilteredAnchor from './SelectFilteredAnchor';
import { SelectFilteredContext } from './SelectFilteredContext';
import type { SelectProps } from './SelectLegacy';
import SelectLegacy from './SelectLegacy';

export type SelectFilteredProps = Omit<SelectProps, 'anchor'> & {
	/** The text typed into the select, for a caller that keeps it; the select keeps its own otherwise. */
	filter?: string;
	/** Called with the text as the user types it, for a caller that keeps `filter`. */
	setFilter?: Dispatch<SetStateAction<string>>;
	/** Replaces the chevron shown while the list is closed. */
	addonIcon?: IconProps['name'];
};

/**
 * A select the user can type into, to narrow its options down to those whose label contains the text.
 */

function SelectFiltered({ options, placeholder, filter: propFilter, setFilter: propSetFilter, ...props }: SelectFilteredProps) {
	const [filter, setFilter] = useState('');

	return (
		<SelectFilteredContext.Provider
			value={{
				placeholder,
				filter: propFilter || filter,
				setFilter: propSetFilter || setFilter,
			}}
		>
			<SelectLegacy placeholder={placeholder} filter={propFilter || filter} options={options} {...props} anchor={SelectFilteredAnchor} />
		</SelectFilteredContext.Provider>
	);
}

export default SelectFiltered;
