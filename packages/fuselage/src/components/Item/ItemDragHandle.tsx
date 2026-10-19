import type { AllHTMLAttributes, ElementType, RefAttributes } from 'react';

import { cx } from '../../helpers/composeClassNames';

export type ItemDragHandleProps = {
	is?: ElementType;
} & Omit<AllHTMLAttributes<HTMLElement>, 'is'> &
	RefAttributes<HTMLElement>;

/**
 * The grip that starts dragging an `Item`, placed as its last slot. The row itself carries the keyboard move,
 * so the grip is hidden from assistive technologies and never takes focus.
 */
const ItemDragHandle = ({ is: Tag = 'span', className, ...props }: ItemDragHandleProps) => (
	<Tag aria-hidden='true' {...props} className={cx('rcx-item__drag-handle', className)}>
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
