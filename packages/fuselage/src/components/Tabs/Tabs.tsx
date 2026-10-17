import { useMergedRefs, useResizeObserver, useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useRef, useState, useEffect } from 'react';

import { Box, type BoxProps } from '../Box';

export type TabsProps = BoxProps & {
	divider?: boolean;
	scrollShadow?: boolean;
};

/**
 * Tabs is a component to navigate around the UI using buttons arranged together with the selected tab highlighted.
 */
function Tabs({ children, divider = true, scrollShadow = true, ...props }: TabsProps) {
	const scrollBoxRef = useRef<HTMLDivElement>(null);
	const { ref: resizeRef, borderBoxSize } = useResizeObserver<HTMLDivElement>();
	const mergedRefs = useMergedRefs(scrollBoxRef, resizeRef);

	const [overflowStart, setOverflowStart] = useState(false);
	const [overflowEnd, setOverflowEnd] = useState(false);

	const checkOverflow = useStableCallback(() => {
		if (!scrollShadow) {
			setOverflowStart(false);
			setOverflowEnd(false);
			return;
		}

		const element = scrollBoxRef.current;
		if (!element) {
			return;
		}

		const isRtl = element.ownerDocument.defaultView?.getComputedStyle(element).direction === 'rtl';
		const { scrollLeft, clientWidth, scrollWidth } = element;

		const canScrollStart = isRtl ? Math.abs(scrollLeft) > 1 : scrollLeft > 1;
		const canScrollEnd = isRtl
			? Math.ceil(Math.abs(scrollLeft) + clientWidth) < scrollWidth - 1
			: Math.ceil(scrollLeft + clientWidth) < scrollWidth - 1;

		setOverflowStart(canScrollStart);
		setOverflowEnd(canScrollEnd);
	});

	useEffect(() => {
		checkOverflow();
	}, [checkOverflow, borderBoxSize.inlineSize, children, scrollShadow]);

	return (
		<Box
			is='div'
			rcx-tabs
			rcx-tabs--with-divider={divider}
			rcx-tabs--overflow-start={scrollShadow && overflowStart}
			rcx-tabs--overflow-end={scrollShadow && overflowEnd}
			{...props}
		>
			<Box is='div' rcx-tabs__scroll-box ref={mergedRefs} onScroll={checkOverflow}>
				<Box is='div' rcx-tabs__wrapper role='tablist'>
					{children}
				</Box>
			</Box>
		</Box>
	);
}

export default Tabs;
