import type { AllHTMLAttributes, ElementType, RefAttributes } from 'react';
import { useMemo } from 'react';

import { ItemGroupContext } from './ItemGroupContext';
import { useIdRegistry } from './useIdRegistry';
import { cx, cxx } from '../../helpers/composeClassNames';

export type ItemGroupProps = {
	/**
	 * The element to render. Use `ul` for a list, or set `role` for a listbox, group or menu.
	 */
	is?: ElementType;
	/**
	 * Dims the whole group while it is being dragged.
	 */
	dragging?: boolean;
	/**
	 * Highlights the group as the place a dragged row will go, when its rows keep their own order.
	 */
	dropTarget?: boolean;
	/**
	 * Draws the line where a dragged group would land, on this group's top (`before`) or bottom (`after`) edge.
	 */
	dropIndicator?: 'before' | 'after';
} & Omit<AllHTMLAttributes<HTMLElement>, 'is'> &
	RefAttributes<HTMLElement>;

/**
 * A list of `Item` rows. An `ItemGroupTitle` inside it labels the group, and its width drives the narrow layout.
 */
const ItemGroup = ({ is: Tag = 'div', dragging, dropTarget, dropIndicator, className, children, ...props }: ItemGroupProps) => {
	const [titleIds, registerTitle] = useIdRegistry();

	const contextValue = useMemo(() => ({ registerTitle }), [registerTitle]);

	const hasOwnLabel = !!props['aria-label'] || !!props['aria-labelledby'];
	const ariaLabelledBy = !hasOwnLabel && titleIds.length > 0 ? titleIds.join(' ') : undefined;

	return (
		<ItemGroupContext.Provider value={contextValue}>
			<Tag
				aria-labelledby={ariaLabelledBy}
				{...props}
				className={cx(
					cxx('rcx-item-group')({ 'dragging': !!dragging, 'drop-target': !!dropTarget, 'drop': dropIndicator ?? false }),
					className,
				)}
			>
				{children}
			</Tag>
		</ItemGroupContext.Provider>
	);
};

export default ItemGroup;
