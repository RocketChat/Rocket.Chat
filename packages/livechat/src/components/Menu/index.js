import { Component } from 'preact';

import { PopoverTrigger } from '../Popover';
import { createClassName, normalizeDOMRect } from '../helpers';
import styles from './styles.scss';

export const Menu = ({ children, hidden, placement, ...props }) => (
	<div className={createClassName(styles, 'menu', { hidden, placement })} {...props}>
		{children}
	</div>
);

export const Group = ({ children, title, ...props }) => (
	<div className={createClassName(styles, 'menu__group')} {...props}>
		{title && <div className={createClassName(styles, 'menu__group-title')}>{title}</div>}
		{children}
	</div>
);

export const Item = ({ children, primary, danger, disabled, icon, ...props }) => (
	<button className={createClassName(styles, 'menu__item', { primary, danger, disabled })} disabled={disabled} {...props}>
		{icon && <div className={createClassName(styles, 'menu__item__icon')}>{icon()}</div>}
		{children}
	</button>
);
class PopoverMenuWrapper extends Component {
	state = {};

	handleRef = (ref) => {
		this.menuRef = ref;
	};

	handleClick = ({ target }) => {
		if (!target.closest(`.${styles.menu__item}`)) {
			return;
		}

		const { dismiss } = this.props;
		dismiss();
	};

	componentDidMount() {
		const { triggerBounds, overlayBounds } = this.props;
		const menuBounds = normalizeDOMRect(this.menuRef.base.getBoundingClientRect());

		const menuWidth = menuBounds.right - menuBounds.left;
		const menuHeight = menuBounds.bottom - menuBounds.top;

		const rightSpace = overlayBounds.right - triggerBounds.left;
		const bottomSpace = overlayBounds.bottom - triggerBounds.bottom;

		const left = menuWidth < rightSpace ? triggerBounds.left - overlayBounds.left : null;
		const right = menuWidth < rightSpace ? null : overlayBounds.right - triggerBounds.right;

		const top = menuHeight < bottomSpace ? triggerBounds.bottom : null;
		const bottom = menuHeight < bottomSpace ? null : overlayBounds.bottom - triggerBounds.top;

		const placement = `${menuWidth < rightSpace ? 'right' : 'left'}-${menuHeight < bottomSpace ? 'bottom' : 'top'}`;

		// eslint-disable-next-line react/no-did-mount-set-state
		this.setState({
			position: { left, right, top, bottom },
			placement,
		});
	}

	render = ({ children }) => (
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

export const PopoverMenu = ({ children, trigger, overlayed }) => (
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
