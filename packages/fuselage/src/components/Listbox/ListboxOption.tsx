import type { PointerEvent, ReactNode } from 'react';
import { memo } from 'react';

import { Option } from '../Option';

export type ListboxOptionProps = {
	/** Referenced by the combobox's `aria-activedescendant` while the option is active. */
	id: string;
	children: ReactNode;
	/** The option the combobox's value holds. */
	selected?: boolean;
	/** The option the keyboard or the pointer is on, which the combobox marks as its active descendant. */
	active?: boolean;
	/** Shows the focus ring on the active option, while the keyboard drives the list. */
	focusVisible?: boolean;
	disabled?: boolean;
	/** Called when the pointer moves onto the option, to make it the active one. */
	onActivate?: () => void;
	onSelect?: () => void;
};

const keepFocusOnCombobox = (event: PointerEvent) => event.preventDefault();

/**
 * An option of a `Listbox`. It never takes focus, so pressing it leaves the focus on the combobox.
 */
function ListboxOption({ id, children, selected, active, focusVisible, disabled, onActivate, onSelect }: ListboxOptionProps) {
	return (
		<Option
			id={id}
			role='option'
			label={children}
			selected={selected}
			focus={active}
			focusVisible={!!focusVisible && !!active}
			disabled={disabled}
			onPointerDown={keepFocusOnCombobox}
			onPointerMove={() => {
				if (!disabled && (!active || focusVisible)) {
					onActivate?.();
				}
			}}
			onClick={() => onSelect?.()}
		/>
	);
}

export default memo(ListboxOption);
