import type { ChangeEvent, RefAttributes } from 'react';
import { useMemo } from 'react';

import { Input, type InputProps } from '../InputBox';
import type { PaginatedSelectProps } from './PaginatedSelect';
import { PaginatedSelect } from './PaginatedSelect';

export type PaginatedSelectFilteredProps = Omit<PaginatedSelectProps, 'setFilter'> &
	RefAttributes<HTMLInputElement> & {
		/** Called with the text as the user types it. */
		setFilter: (value: string | undefined | number) => void;
	};

/**
 * Picks one option from a long list, loaded a page at a time as it scrolls, that the user searches by typing. The caller
 * narrows `options` down to the typed `filter`.
 */

const PaginatedSelectFiltered = ({ filter, setFilter, options, placeholder, ...props }: PaginatedSelectFilteredProps) => {
	const anchor = useMemo(
		() =>
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
