import type { ChangeEvent, RefAttributes } from 'react';
import { useMemo } from 'react';

import { Input, type InputProps } from '../InputBox';
import type { PaginatedSelectProps } from './PaginatedSelect';
import { PaginatedSelect } from './PaginatedSelect';

export type PaginatedSelectFilteredProps = Omit<PaginatedSelectProps, 'setFilter'> &
	RefAttributes<HTMLInputElement> & {
		setFilter: (value: string | undefined | number) => void;
	};

const PaginatedSelectFiltered = ({ filter, setFilter, options, placeholder, ...props }: PaginatedSelectFilteredProps) => {
	const anchor = useMemo(
		() =>
			// eslint-disable-next-line react/display-name, react/no-multi-comp
			({ filter, onChange: _onChange, ...props }: InputProps<HTMLInputElement> & { filter?: string }) => (
				<Input
					className='rcx-select__focus rcx-select__filter rcx-input-box--undecorated'
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
