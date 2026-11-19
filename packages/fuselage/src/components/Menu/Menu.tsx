import type { UsePositionOptions } from '@rocket.chat/fuselage-hooks';
import type { ElementType, ReactElement } from 'react';
import { cloneElement, useRef } from 'react';
import type { AriaMenuProps } from 'react-aria';
import { useButton, useMenuTrigger } from 'react-aria';
import { createPortal } from 'react-dom';
import type { MenuTriggerProps } from 'react-stately';
import { useMenuTriggerState } from 'react-stately';

import { useOwnerDocument } from '../../contexts';
import { IconButton } from '../Button';
import MenuDropDown from './MenuDropdown';
import MenuPopover from './MenuPopover';
import type { IconButtonProps } from '../Button/IconButton';
import { getPlacement } from './helpers/helpers';

export type MenuProps<T> = AriaMenuProps<T> &
	MenuTriggerProps & {
		/** Icon of the trigger. */
		icon?: IconButtonProps['icon'];
		/** The size of the trigger. */
		size?: IconButtonProps['size'];
		/** Where the menu opens beside the trigger. On small screens it opens as a bottom sheet instead. */
		placement?: UsePositionOptions['placement'];
		/** Names the trigger: its tooltip, and its accessible name unless `aria-label` is set. */
		title?: string;
		/** Renders the open menu in the document body, to escape a container that would clip it. */
		detached?: boolean;
		/** Replaces the `IconButton` trigger with a component that takes the same props, such as `NavBarItem`. */
		is?: ElementType;
		/** Class name of the trigger. */
		className?: string;
		/** Shows the trigger pressed while the menu is closed too. */
		pressed?: boolean;
		/** Caps the width of the open menu. */
		maxWidth?: string;
		/** A trigger element to use instead of the `IconButton`; it receives the trigger's props, `icon` and `pressed` included. */
		button?: ReactElement<any>;
	};

/**
 * Opens the actions or choices available at a given moment from a button, such as a kebab beside a row or a toolbar's
 * sort and display options.
 */
const Menu = <T extends object>({
	icon = 'kebab',
	placement = 'bottom-start',
	title,
	is: MenuButton = IconButton,
	className,
	pressed,
	maxWidth = 'x250',
	button,
	detached,
	size = 'small',
	...props
}: MenuProps<T>) => {
	const state = useMenuTriggerState(props);

	const ref = useRef<Element>(null);
	const { menuTriggerProps, menuProps } = useMenuTrigger<T>({}, state, ref);

	const { buttonProps } = useButton(
		{
			...menuTriggerProps,
			'aria-label': props['aria-label'] || title,
			...{ preventFocusOnPress: true },
		},
		ref,
	);

	const { document: ownerDocument } = useOwnerDocument();

	const popover = state.isOpen && (
		<MenuPopover state={state} triggerRef={ref} placement={getPlacement(placement)} maxWidth={maxWidth}>
			<MenuDropDown {...props} {...menuProps} rootMenuTriggerState={state} />
		</MenuPopover>
	);

	return (
		<>
			{button ? (
				cloneElement(button, {
					...buttonProps,
					ref,
					icon,
					className,
					title,
					pressed: pressed || state.isOpen,
				})
			) : (
				<MenuButton
					{...buttonProps}
					ref={ref}
					icon={icon}
					className={className}
					title={title}
					pressed={pressed || state.isOpen}
					size={size}
				/>
			)}
			{detached ? createPortal(popover, ownerDocument?.body || document.body) : popover}
		</>
	);
};

export default Menu;
