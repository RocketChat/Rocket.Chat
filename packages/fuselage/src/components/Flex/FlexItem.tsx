import type { ReactNode } from 'react';
import { useCallback } from 'react';

import { BoxTransforms, useComposedBoxTransform } from '../Box/BoxTransforms';
import type { BoxTransformProps } from '../Box/BoxTransforms';

export type FlexItemProps = {
	children?: ReactNode;
	order?: number;
	grow?: number;
	shrink?: number;
	basis?: number | string | 'auto';
	/** Aligns this item on the cross axis, over the container's `alignItems`. */
	align?: 'auto' | 'start' | 'end' | 'center' | 'stretch';
};

/**
 * Sets how the `Box` it wraps grows, shrinks and aligns in its flex container, without adding an element of its own; a
 * styling prop set on that `Box` wins.
 */
function FlexItem({ children, order, grow, shrink, basis, align }: FlexItemProps) {
	const transformFn = useCallback(
		(boxProps: BoxTransformProps) => {
			if (order !== undefined && boxProps.order === undefined) {
				boxProps.order = order;
			}

			if (grow !== undefined && boxProps.flexGrow === undefined) {
				boxProps.flexGrow = grow;
			}

			if (shrink !== undefined && boxProps.flexShrink === undefined) {
				boxProps.flexShrink = shrink;
			}

			if (basis !== undefined && boxProps.flexBasis === undefined) {
				boxProps.flexBasis = basis;
			}

			if (align !== undefined && boxProps.alignSelf === undefined) {
				boxProps.alignSelf = (align === 'start' && 'flex-start') || (align === 'end' && 'flex-end') || align;
			}

			return boxProps;
		},
		[align, basis, grow, order, shrink],
	);

	return <BoxTransforms.Provider value={useComposedBoxTransform(transformFn)}>{children}</BoxTransforms.Provider>;
}

export default FlexItem;
