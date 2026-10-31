import type { CollectionChildren, Key, KeyboardEvent, Node } from '@react-types/shared';
import type { RefObject } from 'react';
import { useRef } from 'react';
import { mergeProps, useFocusVisible, useMenuItem, useSubmenuTrigger } from 'react-aria';
import type { RootMenuTriggerState, TreeState } from 'react-stately';
import { useSubmenuTriggerState } from 'react-stately';

import { Icon } from '../Icon';
import { Item, ItemIcon } from '../Item';
import MenuDropDown from './MenuDropdown';
import type { MenuOptionProps } from './MenuOption';
import MenuPopover from './MenuPopover';

type MenuSubmenuProps = {
	item: Node<{
		variant?: MenuOptionProps['variant'];
	}>;
	state: TreeState<unknown>;
	rootMenuTriggerState: RootMenuTriggerState;
	parentMenuRef: RefObject<HTMLElement | null>;
	onAction?: (key: Key) => void;
};

/**
 * Renders a menu item that opens a nested submenu.
 *
 * The trigger item belongs to the parent menu's tree state (so arrow-key
 * navigation keeps working), while the submenu renders its own `MenuDropDown`
 * built from the trigger's children — giving it an isolated collection and
 * focus scope, mirroring how `react-aria-components` handles `SubmenuTrigger`.
 */
function MenuSubmenu({ item, state, rootMenuTriggerState, parentMenuRef, onAction }: MenuSubmenuProps) {
	const triggerRef = useRef<HTMLDivElement>(null);
	const submenuRef = useRef<HTMLDivElement>(null);

	const submenuTriggerState = useSubmenuTriggerState({ triggerKey: item.key }, rootMenuTriggerState);

	const { submenuTriggerProps, submenuProps, popoverProps } = useSubmenuTrigger<object>(
		{ parentMenuRef, submenuRef },
		submenuTriggerState,
		triggerRef,
	);

	/** react-aria's submenu hooks bind Escape to `state.closeAll()`, tearing down the whole menu tree. We override Escape so it dismisses only this submenu level — keeping its ancestors open — matching react-aria-components, where Escape closes the latest open submenu one level at a time.
	 **/
	const closeSubmenu = () => {
		// Mirror the ArrowLeft behavior: move focus back to the trigger so the parent menu stays keyboard-navigable and a subsequent Escape closes the next level up.
		triggerRef.current?.focus();
		submenuTriggerState.close();
	};

	/** Fires when focus is inside the submenu (keyboard navigation). */
	const onSubmenuKeyDown = (event: KeyboardEvent) => {
		if (event.key === 'Escape') {
			event.stopPropagation();
			closeSubmenu();
			return;
		}
		submenuProps.onKeyDown?.(event);
	};

	/** Fires when focus is on the trigger itself (e.g. a hover/press-opened submenu). When this submenu is open, close just it; once it's closed, let Escape bubble so the parent menu handles the next level up.
	 **/
	const onTriggerKeyDown = (event: KeyboardEvent) => {
		if (event.key === 'Escape') {
			if (submenuTriggerState.isOpen) {
				closeSubmenu();
				return;
			}
			event.continuePropagation();
			return;
		}
		submenuTriggerProps.onKeyDown?.(event);
	};

	const { isFocusVisible } = useFocusVisible();
	const { menuItemProps, isFocused, isDisabled } = useMenuItem(
		{ ...submenuTriggerProps, onKeyDown: onTriggerKeyDown, key: item.key },
		state,
		triggerRef,
	);

	return (
		<>
			<Item
				{...mergeProps(menuItemProps, {
					'id': submenuTriggerProps.id,
					'aria-haspopup': submenuTriggerProps['aria-haspopup'],
					'aria-expanded': submenuTriggerProps['aria-expanded'],
					'aria-controls': submenuTriggerProps['aria-controls'],
				})}
				ref={triggerRef}
				is='div'
				inset='md'
				focused={isFocused}
				focusVisible={isFocused && isFocusVisible}
				disabled={isDisabled}
				variant={item.value?.variant === 'danger' ? 'danger' : undefined}
			>
				{item.rendered}
				<ItemIcon>
					<Icon name='chevron-right' size='x16' />
				</ItemIcon>
			</Item>
			{submenuTriggerState.isOpen && (
				<MenuPopover {...popoverProps} state={submenuTriggerState} triggerRef={triggerRef} placement='right top'>
					<MenuDropDown
						{...submenuProps}
						onKeyDown={onSubmenuKeyDown}
						rootMenuTriggerState={rootMenuTriggerState}
						menuRef={submenuRef}
						onAction={onAction}
					>
						{item.props?.children as CollectionChildren<object>}
					</MenuDropDown>
				</MenuPopover>
			)}
		</>
	);
}

export default MenuSubmenu;
