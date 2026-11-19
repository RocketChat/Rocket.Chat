import type { UsePositionOptions } from '@rocket.chat/fuselage-hooks';
import type { ElementType, ReactElement } from 'react';
import { cloneElement, useContext, useEffect, useRef } from 'react';
import type { AriaMenuProps } from 'react-aria';
import { useButton, useMenuTrigger } from 'react-aria';
import type { MenuTriggerProps } from 'react-stately';
import { useMenuTriggerState } from 'react-stately';

import { IconButton } from '../Button';
import MenuDropDown from './MenuDropdown';
import MenuPopover from './MenuPopover';
import type { IconButtonProps } from '../Button/IconButton';
import { ItemActionsContext } from '../Item/ItemContext';
import { Overlay } from '../Overlay';
import { getPlacement } from './helpers/helpers';

export type MenuProps<T> = AriaMenuProps<T> &
	MenuTriggerProps & {
		icon?: IconButtonProps['icon'];
		/** The size of the trigger. */
		size?: IconButtonProps['size'];
		placement?: UsePositionOptions['placement'];
		title?: string;
		detached?: boolean;
		/**
		 * A component that renders an IconButton
		 */
		is?: ElementType;
		className?: string;
		pressed?: boolean;
		/** How wide the popup grows: 250px unless stated, or as wide as its content. */
		maxWidth?: 'x250' | 'full';
		button?: ReactElement<any>;
	};

const Menu = <T extends object>({
	icon = 'kebab',
	placement = 'bottom-start',
	title,
	is: MenuButton = IconButton,
	className,
	pressed,
	maxWidth,
	button,
	detached,
	size = 'small',
	...props
}: MenuProps<T>) => {
	const state = useMenuTriggerState(props);
	const reportOpen = useContext(ItemActionsContext);

	// The actions of a row that hide until it is hovered stay shown while the menu they hold is open
	useEffect(() => {
		reportOpen?.(state.isOpen);
		return () => reportOpen?.(false);
	}, [reportOpen, state.isOpen]);

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
			{detached ? <Overlay>{popover}</Overlay> : popover}
		</>
	);
};

export default Menu;
