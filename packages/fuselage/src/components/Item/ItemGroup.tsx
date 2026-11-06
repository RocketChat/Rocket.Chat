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
} & Omit<AllHTMLAttributes<HTMLElement>, 'is'> &
	RefAttributes<HTMLElement>;

/**
 * A list of `Item` rows. An `ItemGroupTitle` inside it labels the group, and its width drives the narrow layout.
 * Placed inside a row's list item, it becomes that row's sub-list and indents one level.
 */
const ItemGroup = ({ is: Tag = 'div', density: densityProp, guide, className, children, ...props }: ItemGroupProps) => {
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
						extended: density === 'extended',
						guide: !!guide && depth > 0,
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
