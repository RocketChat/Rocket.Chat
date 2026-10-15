import type { FocusableElement, Node } from '@react-types/shared';
import type { ReactNode } from 'react';
import { useRef } from 'react';
import { mergeProps, useMenuItem } from 'react-aria';
import type { TreeState } from 'react-stately';

import { MenuItemDescription } from '.';
import type { MenuOptionProps } from './MenuOption';
import MenuOption from './MenuOption';

type MenuItemProps = {
	item: Node<{
		description?: ReactNode;
		variant?: MenuOptionProps['variant'];
	}>;
	state: TreeState<unknown>;
};

function MenuItem({ item, state }: MenuItemProps) {
	const ref = useRef<FocusableElement>(null);
	const {
		menuItemProps: { onPointerUp, ...menuItemProps },
		isFocused,
		isDisabled,
	} = useMenuItem({ key: item.key }, state, ref);

	// There's an issue caused by conflicting event handlers. The popover opens on onPointerDown and the selection event for both, the menu (listbox), happens on onPointerUp.
	// As a workaround, we are overwriting `onPointerDown` event with `onPointerUp`

	return (
		<MenuOption
			{...mergeProps(menuItemProps, { onPointerDown: onPointerUp })}
			ref={ref}
			focus={isFocused}
			disabled={isDisabled}
			is='label'
			variant={item.value?.variant}
		>
			<div className='rcx-option__wrapper'>{item.rendered}</div>
			{item.value && item.value.description && <MenuItemDescription>{item.value.description}</MenuItemDescription>}
		</MenuOption>
	);
}

export default MenuItem;
