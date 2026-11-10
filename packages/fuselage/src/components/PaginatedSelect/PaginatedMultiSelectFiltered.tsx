import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { InputEvent } from 'react';

import { Input, type InputProps } from '../InputBox';
import type { PaginatedMultiSelectProps } from './PaginatedMultiSelect';
import PaginatedMultiSelect from './PaginatedMultiSelect';

export type PaginatedMultiSelectFilteredProps = {
	setFilter?: (value: string) => void;
} & PaginatedMultiSelectProps;

const PaginatedMultiSelectFiltered = ({ filter, setFilter, options, placeholder, ...props }: PaginatedMultiSelectFilteredProps) => {
	const anchor = useStableCallback(
		({ children: _children, filter, last, ...props }: InputProps<HTMLInputElement> & { filter?: string; last?: boolean }) => (
			<Input
				placeholder={placeholder}
				value={filter}
				onInput={(e: InputEvent<HTMLInputElement>) => setFilter?.(e.currentTarget.value)}
				{...props}
				className={['rcx-input-box--undecorated', last && 'rcx-select__anchor'].filter(Boolean).join(' ')}
			/>
		),
	);

	return <PaginatedMultiSelect filter={filter} options={options} anchor={anchor} {...props} />;
};

export default PaginatedMultiSelectFiltered;
