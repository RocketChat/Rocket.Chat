import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { InputEvent } from 'react';

import type { PaginatedMultiSelectProps } from './PaginatedMultiSelect.js';
import PaginatedMultiSelect from './PaginatedMultiSelect.js';
import { FlexItem } from '../Flex/index.js';
import { Input, type InputProps } from '../InputBox/index.js';

export type PaginatedMultiSelectFilteredProps = {
	setFilter?: (value: string) => void;
} & PaginatedMultiSelectProps;

const PaginatedMultiSelectFiltered = ({ filter, setFilter, options, placeholder, ...props }: PaginatedMultiSelectFilteredProps) => {
	const anchor = useStableCallback(
		({ children: _children, filter, className, ...props }: InputProps<HTMLInputElement> & { filter?: string }) => (
			<FlexItem grow={1}>
				<Input
					placeholder={placeholder}
					value={filter}
					onInput={(e: InputEvent<HTMLInputElement>) => setFilter?.(e.currentTarget.value)}
					{...props}
					className={['rcx-input-box--undecorated', className].filter(Boolean).join(' ')}
				/>
			</FlexItem>
		),
	);

	return <PaginatedMultiSelect filter={filter} options={options} anchor={anchor} {...props} />;
};

export default PaginatedMultiSelectFiltered;
