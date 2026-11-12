import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { InputEvent, ReactNode } from 'react';

import { Input, type InputProps } from '../InputBox';
import type { PaginatedMultiSelectProps } from './PaginatedMultiSelect';
import PaginatedMultiSelect from './PaginatedMultiSelect';

export type PaginatedMultiSelectFilteredProps = {
	setFilter?: (value: string) => void;
} & PaginatedMultiSelectProps;

const PaginatedMultiSelectFiltered = ({ filter, setFilter, options, placeholder, ...props }: PaginatedMultiSelectFilteredProps) => {
	const anchor = useStableCallback(
		({ children: _children, filter, className, ...props }: InputProps<HTMLInputElement> & { filter?: string; children?: ReactNode }) => (
			<Input
				placeholder={placeholder}
				value={filter}
				onInput={(e: InputEvent<HTMLInputElement>) => setFilter?.(e.currentTarget.value)}
				{...props}
				undecorated
				last
				className={['rcx-select__anchor--grow', className].filter(Boolean).join(' ')}
			/>
		),
	);

	return <PaginatedMultiSelect filter={filter} options={options} anchor={anchor} {...props} />;
};

export default PaginatedMultiSelectFiltered;
