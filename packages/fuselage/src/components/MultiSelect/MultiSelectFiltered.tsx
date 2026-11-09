import type { Dispatch, SetStateAction } from 'react';
import { useState } from 'react';

import type { IconProps } from '../Icon';
import type { MultiSelectProps } from './MultiSelect';
import MultiSelect from './MultiSelect';
import MultiSelectFilteredAnchor from './MultiSelectFilteredAnchor';
import { MultiSelectFilteredContext } from './MultiSelectFilteredContext';

export type MultiSelectFilteredProps = MultiSelectProps & {
	filter?: string;
	setFilter?: Dispatch<SetStateAction<string>>;
	addonIcon?: IconProps['name'];
};

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
