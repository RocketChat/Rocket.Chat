import type { ButtonHTMLAttributes } from 'react';

import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

export type TabsItemProps = ElementProps<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>> & {
	selected?: boolean;
	disabled?: boolean;
};

function TabsItem({ selected, disabled, ...props }: TabsItemProps) {
	return (
		<Box
			is='button'
			rcx-tabs__item
			rcx-tabs__item--selected={selected}
			rcx-tabs__item--disabled={disabled}
			rcx-tabs__item--selected--disabled={selected && disabled}
			aria-selected={selected ? 'true' : 'false'}
			role='tab'
			{...props}
		/>
	);
}

export default TabsItem;
