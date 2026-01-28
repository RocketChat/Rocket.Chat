import type { ComponentChildren } from 'preact';
import type { HTMLAttributes, TargetedEvent } from 'preact/compat';
import { useState, useRef, useLayoutEffect, useCallback } from 'preact/hooks';

import { createClassName } from '../../helpers/createClassName';
import { normalizeDOMRect } from '../../helpers/normalizeDOMRect';
import { PopoverTrigger } from '../Popover';
import styles from './styles.scss';

type MenuProps = {
	hidden?: boolean;
	placement?: string;
	ref?: any; // FIXME: remove this
} & Omit<HTMLAttributes<HTMLDivElement>, 'ref'>;

export const Menu = ({ children, hidden, placement = '', ...props }: MenuProps) => (
	<div className={createClassName(styles, 'menu', { hidden, placement })} {...props}>
		{children}
	</div>
);

type GroupProps = {
	title?: string;
} & HTMLAttributes<HTMLDivElement>;

export const Group = ({ children, title = '', ...props }: GroupProps) => (
	<div className={createClassName(styles, 'menu__group')} {...props}>
		{title && <div className={createClassName(styles, 'menu__group-title')}>{title}</div>}
		{children}
	</div>
);

type ItemProps = {
	primary?: boolean;
	danger?: boolean;
	disabled?: boolean;
	icon?: () => ComponentChildren;
} & HTMLAttributes<HTMLButtonElement>;

export const Item = ({ children, primary = false, danger = false, disabled = false, icon = undefined, ...props }: ItemProps) => (
	<button className={createClassName(styles, 'menu__item', { primary, danger, disabled })} disabled={disabled} {...props}>
		{icon && <div className={createClassName(styles, 'menu__item__icon')}>{icon()}</div>}
		{children}
	</button>
);

type PopoverMenuWrapperProps = {
	children?: ComponentChildren;
	dismiss: () => void;
	triggerBounds: DOMRect;
	overlayBounds: DOMRect;
};



const PopoverMenuWrapper = ({ children, dismiss, triggerBounds, overlayBounds }: PopoverMenuWrapperProps) => {
	const [position, setPosition] = useState<{
		left?: number;
		right?: number;
		top?: number;
		bottom?: number;
	}>();
	const [placement, setPlacement] = useState<string>();
	const menuRef = useRef<HTMLDivElement | null>(null);

	const handleClick = useCallback(
		({ target }: TargetedEvent<HTMLElement, MouseEvent>) => {
			if (!(target as HTMLElement)?.closest(`.${styles.menu__item}`)) {
				return;
			}
			dismiss();
		},
		[dismiss],
	);

	useLayoutEffect(() => {
		const menuEl = menuRef.current;
		if (!menuEl) {
			return;
		}

		const menuBounds = normalizeDOMRect(menuEl.getBoundingClientRect());

		const menuWidth = menuBounds.right - menuBounds.left;
		const menuHeight = menuBounds.bottom - menuBounds.top;

		const rightSpace = overlayBounds.right - triggerBounds.left;
		const bottomSpace = overlayBounds.bottom - triggerBounds.bottom;

		const left = menuWidth < rightSpace ? triggerBounds.left - overlayBounds.left : undefined;
		const right = menuWidth < rightSpace ? undefined : overlayBounds.right - triggerBounds.right;

		const top = menuHeight < bottomSpace ? triggerBounds.bottom : undefined;
		const bottom = menuHeight < bottomSpace ? undefined : overlayBounds.bottom - triggerBounds.top;

		const placementValue = `${menuWidth < rightSpace ? 'right' : 'left'}-${menuHeight < bottomSpace ? 'bottom' : 'top'}`;

		setPosition({ left, right, top, bottom });
		setPlacement(placementValue);
	}, [triggerBounds, overlayBounds],);

	return (
		<Menu ref={menuRef} style={{ position: 'absolute', ...position }} placement={placement} onClickCapture={handleClick}>
			{children}
		</Menu>
	);
};

type PopoverMenuProps = {
	children?: ComponentChildren;
	trigger: (contextValue: { pop: () => void }) => void;
	overlayed?: boolean;
};

export const PopoverMenu = ({ children = null, trigger, overlayed }: PopoverMenuProps) => (
	<PopoverTrigger
		overlayProps={{
			className: overlayed ? createClassName(styles, 'popover-menu__overlay') : null,
		}}
	>
		{trigger}
		{({ dismiss, triggerBounds, overlayBounds }) => (
			<PopoverMenuWrapper dismiss={dismiss} triggerBounds={triggerBounds} overlayBounds={overlayBounds}>
				{children}
			</PopoverMenuWrapper>
		)}
	</PopoverTrigger>
);

Menu.Group = Group;
Menu.Item = Item;
Menu.Popover = PopoverMenu;

export default Menu;
