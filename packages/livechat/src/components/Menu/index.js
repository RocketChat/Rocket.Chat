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
	<div className={createClassName(styles, 'menu__group')} role='menu' {...props}>
		{title && <div className={createClassName(styles, 'menu__group-title')}>{title}</div>}
		{children}
	</div>
);


export const Item = ({ children, primary, danger, disabled, icon, ...props }) =>
	<button
		className={createClassName(styles, 'menu__item', { primary, danger, disabled })}
		disabled={disabled}
		role='menuitem'
		{...props}
	>
		{icon && (
			<div className={createClassName(styles, 'menu__item__icon')}>
				{icon()}
			</div>
		)}
		{children}
	</button>;
class PopoverMenuWrapper extends Component {
	state = {}

	handleRef = (ref) => {
		this.menuRef = ref;
	}

	handleClick = ({ target }) => {
		if (!target.closest(`.${ styles.menu__item }`)) {
			return;
		}

		const { dismiss } = this.props;
		dismiss();
	}

	handleKeyDown = (e) => {
		const { key } = e;

		switch (key) {
			case 'Tab':
				this.handleTabKey(e);
				break;
			default:
				break;
		}
	}

	handleTabKey = (e) => {
		const focusableElements = this.getFocusableElements();

		if (focusableElements.length > 0) {
			const firstElement = focusableElements[0];
			const lastElement = focusableElements[focusableElements.length - 1];

			if (!e.shiftKey && document.activeElement !== firstElement) {
				firstElement.focus();
				return e.preventDefault();
			}

			if (e.shiftKey && document.activeElement !== lastElement) {
				lastElement.focus();
				return e.preventDefault();
			}
		}
	};

	addFocusFirstElement = () => {
		const focusableElements = this.getFocusableElements();
		if (focusableElements.length > 0) {
			focusableElements[0].focus();
		}
	}

	getFocusableElements = () => this.menuRef.base.querySelectorAll(
		'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select',
	)

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

		const placement = `${ menuWidth < rightSpace ? 'right' : 'left' }-${ menuHeight < bottomSpace ? 'bottom' : 'top' }`;

		this.addFocusFirstElement();
		window.addEventListener('keydown', this.handleKeyDown, false);

		// eslint-disable-next-line react/no-did-mount-set-state
		this.setState({
			position: { left, right, top, bottom },
			placement,
		});
	}

	componentWillUnmount() {
		window.removeEventListener('keydown', this.handleKeyDown, false);
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
	)
}


export const PopoverMenu = ({ children, trigger, overlayed }) => (
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


Menu.Group = Group;
Menu.Item = Item;
Menu.Popover = PopoverMenu;


export default Menu;
