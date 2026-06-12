import { useResizeObserver, useStableArray } from '@rocket.chat/fuselage-hooks';
import { useMemo } from 'react';

export const useResizeInlineBreakpoint = <TElement extends Element>(sizes: number[] = [], debounceDelay = 0) => {
	const { ref, borderBoxSize } = useResizeObserver<TElement>({ debounceDelay });
	const inlineSize = borderBoxSize ? borderBoxSize.inlineSize : 0;
	const stableSizes = useStableArray(sizes);
	const newSizes = useMemo(() => stableSizes.map((current) => (inlineSize ? inlineSize > current : true)), [inlineSize, stableSizes]);
	return [ref, ...newSizes] as const;
};
