import type { AllHTMLAttributes, ElementType, RefAttributes } from 'react';

import { cx, cxx } from '../../helpers/composeClassNames';

export type ItemMediaProps = {
	is?: ElementType;
	/**
	 * `icon` centers its child in a 20px box, for icons and status bullets.
	 */
	variant?: 'default' | 'icon';
} & Omit<AllHTMLAttributes<HTMLElement>, 'is'> &
	RefAttributes<HTMLElement>;

/**
 * The leading avatar, icon or thumbnail of an `Item`. Its box fits its child, so the child's size sets the row height.
 */
const ItemMedia = ({ is: Tag = 'div', variant = 'default', className, ...props }: ItemMediaProps) => (
	<Tag {...props} className={cx(cxx('rcx-item__media')({ icon: variant === 'icon' }), className)} />
);

export default ItemMedia;
