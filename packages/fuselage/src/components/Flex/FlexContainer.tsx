import type { ReactNode } from 'react';
import { useCallback } from 'react';

import { BoxTransforms, useComposedBoxTransform } from '../Box/BoxTransforms';
import type { BoxTransformProps } from '../Box/BoxTransforms';

export type FlexContainerProps = {
	children?: ReactNode;
	inline?: boolean;
	direction?: 'row' | 'row-reverse' | 'column' | 'column-reverse';
	wrap?: 'no-wrap' | 'wrap' | 'wrap-reverse';
	alignItems?: 'stretch' | 'start' | 'center' | 'end' | 'baseline';
	alignContent?: 'start' | 'center' | 'end' | 'space-between' | 'space-around';
	justifyContent?: 'start' | 'center' | 'end' | 'space-between' | 'space-around';
};

function FlexContainer({ inline = false, children, direction, wrap, alignItems, alignContent, justifyContent }: FlexContainerProps) {
	const transformFn = useCallback(
		(boxProps: BoxTransformProps) => {
			if (inline !== undefined && boxProps.display === undefined) {
				boxProps.display = inline ? 'inline-flex' : 'flex';
			}

			if (direction !== undefined && boxProps.flexDirection === undefined) {
				boxProps.flexDirection = direction;
			}

			if (wrap !== undefined && boxProps.flexWrap === undefined) {
				boxProps.flexWrap = wrap === 'no-wrap' ? 'nowrap' : wrap;
			}

			if (alignItems !== undefined && boxProps.alignItems === undefined) {
				boxProps.alignItems = (alignItems === 'start' && 'flex-start') || (alignItems === 'end' && 'flex-end') || alignItems;
			}

			if (alignContent !== undefined && boxProps.alignContent === undefined) {
				boxProps.alignContent = (alignContent === 'start' && 'flex-start') || (alignContent === 'end' && 'flex-end') || alignContent;
			}

			if (justifyContent !== undefined && boxProps.justifyContent === undefined) {
				boxProps.justifyContent =
					(justifyContent === 'start' && 'flex-start') || (justifyContent === 'end' && 'flex-end') || justifyContent;
			}

			return boxProps;
		},
		[alignContent, alignItems, direction, inline, justifyContent, wrap],
	);

	return <BoxTransforms.Provider value={useComposedBoxTransform(transformFn)}>{children}</BoxTransforms.Provider>;
}

export default FlexContainer;
