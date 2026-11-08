import type { Dispatch, SetStateAction } from 'react';
import { useState } from 'react';

import type { IconProps } from '..';
import SelectFilteredAnchor from './SelectFilteredAnchor';
import { SelectFilteredContext } from './SelectFilteredContext';
import type { SelectProps } from './SelectLegacy';
import SelectLegacy from './SelectLegacy';

export type SelectFilteredProps = Omit<SelectProps, 'anchor'> & {
	filter?: string;
	setFilter?: Dispatch<SetStateAction<string>>;
	addonIcon?: IconProps['name'];
};

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
