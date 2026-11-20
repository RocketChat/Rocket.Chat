import type { AllHTMLAttributes, ElementType, RefAttributes } from 'react';
import { useMemo } from 'react';

import { ItemGroupContext, useItemGroupContext } from './ItemGroupContext';
import type { ItemDensity } from './types';
import { useIdRegistry } from './useIdRegistry';
import { cx, cxx } from '../../helpers/composeClassNames';

// Deeper groups keep the indent of this depth, so titles never run out of room.
const maxIndentDepth = 4;

export type ItemGroupProps = {
	/**
	 * The element to render. Use `ul` for a list, or set `role` for a listbox, group or menu.
	 */
	is?: ElementType;
	/**
	 * Sets the indent steps of nested groups: `compact` for rows led by a 20px icon or avatar,
	 * `extended` for rows led by a 36px avatar whose sub-rows use a 28px one. Nested groups inherit it.
	 */
	density?: ItemDensity;
	/**
	 * Draws a line from the parent row's `ItemDisclosure` down the nested rows. Applies to nested groups only.
	 */
	guide?: boolean;
	/**
	 * Dims the whole group while it is being dragged.
	 */
	dragging?: boolean;
	/**
	 * Highlights the group as the place a dragged row goes into, when its rows keep their own order: `available` while a drag
	 * that could land on it is under way, `active` while the pointer is over it.
	 */
	dropTarget?: 'available' | 'active';
	/**
	 * Draws the line where a dragged group would land, on this group's top (`before`) or bottom (`after`) edge.
	 */
	dropIndicator?: 'before' | 'after';
	/**
	 * Marks the group as hovered by a drag that cannot land on it.
	 */
	dropDisabled?: boolean;
	/**
	 * Flashes the group once, where a dragged or keyboard-moved group has just landed.
	 */
	dropped?: boolean;
} & Omit<AllHTMLAttributes<HTMLElement>, 'is'> &
	RefAttributes<HTMLElement>;

/**
 * A list of `Item` rows. An `ItemGroupTitle` inside it labels the group, and its width drives the narrow layout.
 * Placed inside a row's list item, it becomes that row's sub-list and indents one level.
 */
const ItemGroup = ({
	is: Tag = 'div',
	density: densityProp,
	guide,
	dragging,
	dropTarget,
	dropIndicator,
	dropDisabled,
	dropped,
	className,
	children,
	...props
}: ItemGroupProps) => {
	const parent = useItemGroupContext();
	const depth = parent.depth + 1;
	const density = densityProp ?? parent.density;
	const [titleIds, registerTitle] = useIdRegistry();

	const contextValue = useMemo(() => ({ registerTitle, depth, density }), [registerTitle, depth, density]);

	const hasOwnLabel = !!props['aria-label'] || !!props['aria-labelledby'];
	const ariaLabelledBy = !hasOwnLabel && titleIds.length > 0 ? titleIds.join(' ') : undefined;
	const indentDepth = Math.min(depth, maxIndentDepth);

	return (
		<ItemGroupContext.Provider value={contextValue}>
			<Tag
				aria-labelledby={ariaLabelledBy}
				{...props}
				className={cx(
					cxx('rcx-item-group')({
						[`depth-${indentDepth}`]: depth > 0,
						'extended': density === 'extended',
						'guide': !!guide && depth > 0,
						'dragging': !!dragging,
						'drop-target': dropTarget ?? false,
						'drop': dropIndicator ?? false,
						'drop-disabled': !!dropDisabled,
						'dropped': !!dropped,
					}),
					className,
				)}
			>
				{children}
			</Tag>
		</ItemGroupContext.Provider>
	);
};

export default ItemGroup;
