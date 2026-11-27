import type { AllHTMLAttributes, RefAttributes } from 'react';

import { ToastBarContext, type ToastBarVariant } from './ToastBarContext';
import { cx } from '../../helpers/composeClassNames';
import Item, { type ItemProps } from '../Item/Item';

export type ToastBarSurfaceProps = {
	/**
	 * The element to render. Use `li` when the toasts are a list.
	 */
	is?: 'div' | 'li';
	/**
	 * Draws the colored stripe, and picks the icon of `ToastBarIcon` and the announcement role of `ToastBarMessage`.
	 * Without it, the surface has no stripe.
	 */
	variant?: ToastBarVariant;
} & Pick<ItemProps, 'inset' | 'insetBlock' | 'align' | 'multiline'> &
	Omit<AllHTMLAttributes<HTMLElement>, 'is' | 'selected' | 'disabled'> &
	RefAttributes<HTMLElement>;

/**
 * The toast itself, composed from `ToastBar*` and `Item*` parts.
 */
const ToastBarSurface = ({
	is = 'div',
	variant,
	inset = 'md',
	insetBlock = 'lg',
	align = 'start',
	className,
	...props
}: ToastBarSurfaceProps) => (
	<ToastBarContext.Provider value={variant}>
		<Item
			{...props}
			multiline
			is={is}
			inset={inset}
			insetBlock={insetBlock}
			align={align}
			className={cx('rcx-toastbar', variant && `rcx-toastbar--${variant}`, className)}
		/>
	</ToastBarContext.Provider>
);

export default ToastBarSurface;
