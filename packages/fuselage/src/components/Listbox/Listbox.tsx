import type { AllHTMLAttributes, ReactNode, RefAttributes } from 'react';

import { Box } from '../Box';

export type ListboxProps = {
	/** Referenced by the combobox's `aria-controls`. */
	id: string;
	children?: ReactNode;
} & Omit<AllHTMLAttributes<HTMLUListElement>, 'id' | 'is' | 'role' | 'children'> &
	RefAttributes<HTMLUListElement>;

/**
 * A popup list of `ListboxOption`s that a combobox controls: focus stays on the combobox, which marks the active option with `aria-activedescendant`.
 */
function Listbox({ children, ...props }: ListboxProps) {
	return (
		<Box is='ul' role='listbox' margin={0} padding={0} {...props}>
			{children}
		</Box>
	);
}

export default Listbox;
