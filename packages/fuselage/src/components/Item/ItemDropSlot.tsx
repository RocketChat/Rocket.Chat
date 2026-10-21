import type { AllHTMLAttributes, ElementType, RefAttributes } from 'react';

import { cx, cxx } from '../../helpers/composeClassNames';

export type ItemDropSlotProps = {
	/**
	 * The element to render. Inside an `ItemGroup` rendered as `ul`, pass `li`.
	 */
	is?: ElementType;
	/**
	 * `available` while a drag that could land in the empty group is under way, `active` while the pointer is over it.
	 */
	dropTarget?: 'available' | 'active';
} & Omit<AllHTMLAttributes<HTMLElement>, 'is'> &
	RefAttributes<HTMLElement>;

/**
 * The row-high place a dragged row can land in an empty group. Its children are the hint, such as "Drop here".
 */
const ItemDropSlot = ({ is: Tag = 'div', dropTarget, className, ...props }: ItemDropSlotProps) => (
	<Tag {...props} className={cx(cxx('rcx-item-drop-slot')({ 'drop-target': dropTarget ?? false }), className)} />
);

export default ItemDropSlot;
