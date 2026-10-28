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
		// `order` is the anchor's place among the chips, which the select's stylesheet sets for an input
		({
			children: _children,
			filter,
			className,
			order: _order,
			...props
		}: InputProps<HTMLInputElement> & { filter?: string; order?: number }) => (
			<Input
				placeholder={placeholder}
				value={filter}
				onInput={(e: InputEvent<HTMLInputElement>) => setFilter?.(e.currentTarget.value)}
				{...props}
				className={['rcx-input-box--undecorated', className].filter(Boolean).join(' ')}
			/>
		),
	);

	return <PaginatedMultiSelect filter={filter} options={options} anchor={anchor} {...props} />;
};

export default PaginatedMultiSelectFiltered;
