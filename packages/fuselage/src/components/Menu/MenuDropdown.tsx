import type { KeyboardEvent } from '@react-types/shared';
import type { RefObject } from 'react';
import { useRef } from 'react';
import type { AriaMenuProps } from 'react-aria';
import { useMenu } from 'react-aria';
import type { RootMenuTriggerState } from 'react-stately';
import { useTreeState } from 'react-stately';

import MenuItem from './MenuItem';
import MenuSection from './MenuSection';
import MenuSubmenu from './MenuSubmenu';

export type MenuDropDownProps<T extends object> = AriaMenuProps<T> & {
	/**
	 * The root menu trigger state, shared across every (sub)menu level so the
	 * submenu hooks can track the open submenu stack.
	 */
	rootMenuTriggerState: RootMenuTriggerState;
	/**
	 * Ref of the menu container. Submenus pass their `submenuRef` here so
	 * `useSubmenuTrigger` can wire pointer/keyboard behavior to the right element.
	 */
	menuRef?: RefObject<HTMLDivElement | null>;
	/** The nesting level of the menu, provided by `useSubmenuTrigger` for submenus. */
	submenuLevel?: number;
	/**
	 * Keydown handler forwarded to the underlying menu element. Submenus use this
	 * to override the Escape behavior so it closes a single level at a time.
	 */
	onKeyDown?: (event: KeyboardEvent) => void;
};

function MenuDropDown<T extends object>({ rootMenuTriggerState, menuRef, ...props }: MenuDropDownProps<T>) {
	const state = useTreeState(props);

	const fallbackRef = useRef<HTMLDivElement>(null);
	const ref = menuRef ?? fallbackRef;
	const { menuProps } = useMenu(props, state, ref);

	return (
		<div {...menuProps} ref={ref}>
			{[...state.collection].map((item) => {
				if (item.type === 'section') {
					return (
						<MenuSection
							key={item.key}
							section={item}
							state={state}
							rootMenuTriggerState={rootMenuTriggerState}
							parentMenuRef={ref}
							onAction={props.onAction}
						/>
					);
				}

				if (item.hasChildNodes) {
					return (
						<MenuSubmenu
							key={item.key}
							item={item}
							state={state}
							rootMenuTriggerState={rootMenuTriggerState}
							parentMenuRef={ref}
							onAction={props.onAction}
						/>
					);
				}

				return <MenuItem key={item.key} item={item} state={state} />;
			})}
		</div>
	);
}

export default MenuDropDown;
