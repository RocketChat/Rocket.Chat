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
	align?: 'auto' | 'start' | 'end' | 'center' | 'stretch';
};

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
