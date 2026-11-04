import type { AllHTMLAttributes, ElementType, RefAttributes } from 'react';

import { cx, cxx } from '../../helpers/composeClassNames';

export type ItemDragHandleProps = {
	is?: ElementType;
	/**
	 * Shows the grip as unavailable, for a row that cannot move right now.
	 */
	disabled?: boolean;
} & Omit<AllHTMLAttributes<HTMLElement>, 'is' | 'disabled'> &
	RefAttributes<HTMLElement>;

/**
 * The grip that starts dragging an `Item`, placed as its last slot. The row itself carries the keyboard move,
 * so the grip is hidden from assistive technologies and never takes focus.
 */
const ItemDragHandle = ({ is: Tag = 'span', disabled, className, ...props }: ItemDragHandleProps) => (
	<Tag aria-hidden='true' {...props} className={cx(cxx('rcx-item__drag-handle')({ disabled: !!disabled }), className)}>
		<svg width='10' height='16' viewBox='0 0 10 16' fill='currentColor'>
			<circle cx='2' cy='3' r='1.5' />
			<circle cx='8' cy='3' r='1.5' />
			<circle cx='2' cy='8' r='1.5' />
			<circle cx='8' cy='8' r='1.5' />
			<circle cx='2' cy='13' r='1.5' />
			<circle cx='8' cy='13' r='1.5' />
		</svg>
	</Tag>
);

export default ItemDragHandle;
