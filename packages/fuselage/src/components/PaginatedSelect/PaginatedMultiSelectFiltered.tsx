import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { InputEvent } from 'react';

import { FlexItem } from '../Flex';
import { Input, type InputProps } from '../InputBox';
import type { PaginatedMultiSelectProps } from './PaginatedMultiSelect';
import PaginatedMultiSelect from './PaginatedMultiSelect';

export type PaginatedMultiSelectFilteredProps = {
	/** Called with the text as the user types it. */
	setFilter?: (value: string) => void;
} & PaginatedMultiSelectProps;

/**
 * Picks several options from a long list, loaded a page at a time as it scrolls, that the user searches by typing. The
 * caller narrows `options` down to the typed `filter`. Each one picked shows as a chip, which deselects it when clicked.
 */

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
