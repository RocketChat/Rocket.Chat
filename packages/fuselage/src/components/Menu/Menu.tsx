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
		icon?: IconButtonProps['icon'];
		large?: boolean;
		medium?: boolean;
		small?: boolean;
		tiny?: boolean;
		mini?: boolean;
		placement?: UsePositionOptions['placement'];
		title?: string;
		detached?: boolean;
		/**
		 * A component that renders an IconButton
		 */
		is?: ElementType;
		className?: string;
		pressed?: boolean;
		maxWidth?: string;
		button?: ReactElement<any>;
	};

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
	...props
}: MenuProps<T>) => {
	const state = useMenuTriggerState(props);

	const ref = useRef<Element>(null);
	const { menuTriggerProps, menuProps } = useMenuTrigger<T>({}, state, ref);

	const resolvedTitle = title ?? button?.props?.title;
	const ariaLabel = props['aria-label'] || button?.props?.['aria-label'] || title;

	const { buttonProps } = useButton(
		{
			...menuTriggerProps,
			...(ariaLabel && { 'aria-label': ariaLabel }),
			preventFocusOnPress: true,
		},
		ref,
	);

	const { large, medium, tiny, mini } = props;
	const sizes = { large, medium, tiny, mini };
	const defaultSmall = !large && !medium && !tiny && !mini;

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
					...(resolvedTitle !== undefined && { title: resolvedTitle }),
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
					small={defaultSmall}
					{...sizes}
				/>
			)}
			{detached ? createPortal(popover, ownerDocument?.body || document.body) : popover}
		</>
	);
};

export default Menu;
