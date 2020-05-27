import { useMemo } from 'react';
import { useResizeObserver } from '@rocket.chat/fuselage-hooks';

export const useResizeInlineBreakpoint = (sizes = [], debounceDelay = 0) => {
	const { ref, borderBoxSize } = useResizeObserver({ debounceDelay });
	const inlineSize = borderBoxSize ? borderBoxSize.inlineSize : 0;
	const newSizes = useMemo(() => sizes.map((current) => (inlineSize ? inlineSize > current : true)), [inlineSize]);
	return [ref, ...newSizes];
};
