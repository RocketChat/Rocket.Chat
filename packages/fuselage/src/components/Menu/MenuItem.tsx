import type { Node } from '@react-types/shared';
import type { ReactNode } from 'react';
import { useRef } from 'react';
import { mergeProps, useFocusVisible, useMenuItem } from 'react-aria';
import type { TreeState } from 'react-stately';

import { Item, ItemContent, ItemTitle } from '../Item';
import type { MenuOptionProps } from './MenuOption';

type MenuItemProps = {
	item: Node<{
		description?: ReactNode;
		variant?: MenuOptionProps['variant'];
	}>;
	state: TreeState<unknown>;
};

/**
 * Renders a menu item as an `Item` row, so its content is composed from `Item` parts.
 */
function MenuItem({ item, state }: MenuItemProps) {
	const ref = useRef<HTMLLabelElement>(null);
	const { isFocusVisible } = useFocusVisible();
	const {
		menuItemProps: { onPointerUp, ...menuItemProps },
		isFocused,
		isDisabled,
	} = useMenuItem({ key: item.key }, state, ref);

	const description = item.value?.description;

	// There's an issue caused by conflicting event handlers. The popover opens on onPointerDown and the selection event for both, the menu (listbox), happens on onPointerUp.
	// As a workaround, we are overwriting `onPointerDown` event with `onPointerUp`

	return (
		<Item
			{...mergeProps(menuItemProps, { onPointerDown: onPointerUp })}
			ref={ref}
			is='label'
			inset='md'
			focused={isFocused}
			focusVisible={isFocused && isFocusVisible}
			disabled={isDisabled}
			variant={item.value?.variant === 'danger' ? 'danger' : undefined}
			className={description ? 'rcx-menu-item--with-description' : undefined}
		>
			{typeof item.rendered === 'string' ? (
				<ItemContent>
					<ItemTitle>{item.rendered}</ItemTitle>
				</ItemContent>
			) : (
				item.rendered
			)}
			{description && <div className='rcx-menu-item__description'>{description}</div>}
		</Item>
	);
}

export default MenuItem;
