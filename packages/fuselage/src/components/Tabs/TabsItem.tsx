import type { RefAttributes } from 'react';

import { Box, type BoxProps } from '../Box';

export type TabsItemProps = Omit<BoxProps, 'ref'> &
	RefAttributes<HTMLButtonElement> & {
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
