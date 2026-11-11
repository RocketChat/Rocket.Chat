import type { ChangeEvent, RefAttributes } from 'react';
import { useMemo } from 'react';

import type { PaginatedSelectProps } from './PaginatedSelect';
import { PaginatedSelect } from './PaginatedSelect';
import SelectFilter, { type SelectFilterProps } from '../Select/SelectFilter';

export type PaginatedSelectFilteredProps = Omit<PaginatedSelectProps, 'setFilter'> &
	RefAttributes<HTMLInputElement> & {
		setFilter: (value: string | undefined | number) => void;
	};

const PaginatedSelectFiltered = ({ filter, setFilter, options, placeholder, ...props }: PaginatedSelectFilteredProps) => {
	const anchor = useMemo(
		() =>
			({ filter, onChange: _onChange, ...props }: SelectFilterProps & { filter?: string }) => (
				<SelectFilter
					placeholder={placeholder}
					value={filter}
					onChange={(e: ChangeEvent<HTMLInputElement>) => {
						setFilter(e.currentTarget.value);
					}}
					{...props}
				/>
			),
		[placeholder, setFilter],
	);

	return <PaginatedSelect placeholder={undefined} filter={filter} options={options} {...props} anchor={anchor} />;
};

export default PaginatedSelectFiltered;
