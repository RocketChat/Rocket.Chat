import type { AriaSelectProps } from '@react-types/select';
import type { AllHTMLAttributes, Key, RefAttributes } from 'react';
import { Item } from 'react-stately';

import type { SelectAriaProps } from './SelectAria';
import { SelectAria } from './SelectAria';
import type { SelectOption } from './SelectLegacy';

export type SelectProps<T, V extends Key> = Omit<AriaSelectProps<T>, 'value' | 'onChange' | 'children'> &
	RefAttributes<HTMLElement> & {
		error?: string;
		placeholder?: string;
		value?: V | null;
		onChange?: ((key: V) => any) | undefined;
		options: SelectOption[];
		small?: boolean;
	} & Omit<AllHTMLAttributes<HTMLElement>, 'value' | 'onChange'>;

/**
 * An input for selection of options.
 */
function Select<T, V extends Key>({ options, ref, ...props }: SelectProps<T, V>) {
	return (
		<SelectAria ref={ref} {...(props as SelectAriaProps<object>)}>
			{options.map((option) => (
				<Item title={option[1] ?? option[0]} textValue={option[0]} key={option[0]}>
					{option[1] ?? option[0]}
				</Item>
			))}
		</SelectAria>
	);
}

export default Select;
