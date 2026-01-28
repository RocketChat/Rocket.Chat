import { Component, type ComponentChildren } from 'preact';
import { forwardRef } from 'preact/compat';
import type { HTMLAttributes, TargetedEvent } from 'preact/compat';

import { createClassName } from '../../helpers/createClassName';
import { normalizeDOMRect } from '../../helpers/normalizeDOMRect';
import { PopoverTrigger } from '../Popover';
import styles from './styles.scss';

/* ------------------------------------------------------------------ */
/* Menu */
/* ------------------------------------------------------------------ */

type MenuProps = {
	hidden?: boolean;
	placement?: string;
} & HTMLAttributes<HTMLDivElement>;

export const Menu = forwardRef<HTMLDivElement, MenuProps>(
	({ children, hidden, placement = '', ...props }, ref) => (
		<div
			ref={ref}
			className={createClassName(styles, 'menu', { hidden, placement })}
			{...props}
		>
			{children}
		</div>
	)
);

Menu.displayName = 'Menu';

/* ------------------------------------------------------------------ */
/* Group */
/* ------------------------------------------------------------------ */

type GroupProps = {
	title?: string;
} & HTMLAttributes<HTMLDivElement>;

export const Group = ({ children, title = '', ...props }: GroupProps) => (
	<div className={createClassName(styles, 'menu__group')} {...props}>
		{title && <div className={createClassName(styles, 'menu__group-title')}>{title}</div>}
		{children}
	</div>
);

/* ------------------------------------------------------------------ */
/* Item */
/* ------------------------------------------------------------------ */

type ItemProps = {
	primary?: boolean;
	danger?: boolean;
	disabled?: boolean;
	icon?: () => ComponentChildren;
} & HTMLAttributes<HTMLButtonElement>;

export const Item = ({
	children,
	primary = false,
	danger = false,
	disabled = false,
	icon,
	...props
}: ItemProps) => (
	<button
		className={createClassName(styles, 'menu__item', { primary, danger, disabled })}
		disabled={disabled}
		{...props}
	>
		{icon && <div className={createClassName(styles, 'menu__item__icon')}>{icon()}</div>}
		{children}
	</button>
);

/* ------------------------------------------------------------------ */
/* PopoverMenuWrapper */
/* ------------------------------------------------------------------ */

type PopoverMenuWrapperProps = {
	children?: ComponentChildren;
	dismiss: () => void;
	triggerBounds: DOMRect;
	overlayBounds: DOMRect;
};

type PopoverMenuWrapperState = {
	position?: {
		left?: number;
		right?: number;
		top?: number;
		bottom?: number;
	};
	placement?: string;
};

class PopoverMenuWrapper extends Component<
	PopoverMenuWrapperProps,
	PopoverMenuWrapperState
> {
	override state: PopoverMenuWrapperState = {};

	menuRef: HTMLDivElement | null = null;

	handleRef = (el: HTMLDivElement | null) => {
		this.menuRef = el;
	};

	handleClick = ({ target }: TargetedEvent<HTMLElement, MouseEvent>) => {
		if (!(target as HTMLElement)?.closest(`.${styles.menu__item}`)) {
			return;
		}
		this.props.dismiss();
	};

	override componentDidMount() {
		const { triggerBounds, overlayBounds } = this.props;

		const menuBounds = normalizeDOMRect(
			this.menuRef?.getBoundingClientRect()
		);

		const menuWidth = menuBounds.right - menuBounds.left;
		const menuHeight = menuBounds.bottom - menuBounds.top;

		const rightSpace = overlayBounds.right - triggerBounds.left;
		const bottomSpace = overlayBounds.bottom - triggerBounds.bottom;

		const left = menuWidth < rightSpace ? triggerBounds.left - overlayBounds.left : undefined;
		const right = menuWidth < rightSpace ? undefined : overlayBounds.right - triggerBounds.right;

		const top = menuHeight < bottomSpace ? triggerBounds.bottom : undefined;
		const bottom = menuHeight < bottomSpace ? undefined : overlayBounds.bottom - triggerBounds.top;

		const placement = `${menuWidth < rightSpace ? 'right' : 'left'}-${menuHeight < bottomSpace ? 'bottom' : 'top'}`;

		this.setState({
			position: { left, right, top, bottom },
			placement,
		});
	}

	render = ({ children }: PopoverMenuWrapperProps) => (
		<Menu
			ref={this.handleRef}
			style={{ position: 'absolute', ...this.state.position }}
			placement={this.state.placement}
			onClickCapture={this.handleClick}
		>
			{children}
		</Menu>
	);
}

/* ------------------------------------------------------------------ */
/* PopoverMenu */
/* ------------------------------------------------------------------ */

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
			<PopoverMenuWrapper
				dismiss={dismiss}
				triggerBounds={triggerBounds}
				overlayBounds={overlayBounds}
			>
				{children}
			</PopoverMenuWrapper>
		)}
	</PopoverTrigger>
);

/* ------------------------------------------------------------------ */
/* Static bindings */
/* ------------------------------------------------------------------ */

Menu.Group = Group;
Menu.Item = Item;
Menu.Popover = PopoverMenu;

export default Menu;
