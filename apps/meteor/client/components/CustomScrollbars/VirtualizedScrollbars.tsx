import { useOverlayScrollbars } from 'overlayscrollbars-react';
import type { HTMLAttributes, ReactElement } from 'react';
import { useEffect, useState, useRef, cloneElement, forwardRef, memo } from 'react';

import BaseScrollbars, { getScrollbarsOptions } from './BaseScrollbars';

type VirtualizedScrollbarsProps = {
	overflowX?: boolean;
	children: ReactElement;
} & Omit<HTMLAttributes<HTMLDivElement>, 'is'>;

const VirtualizedScrollbars = forwardRef<HTMLElement, VirtualizedScrollbarsProps>(function VirtualizedScrollbars(
	{ overflowX, ...props },
	ref,
) {
	const rootRef = useRef(null);
	const [scroller, setScroller] = useState(null);
	const scrollbarsOptions = getScrollbarsOptions(overflowX);
	const [initialize, osInstance] = useOverlayScrollbars({
		options: scrollbarsOptions,
		defer: true,
	});

	useEffect(() => {
		const { current: root } = rootRef;

		if (scroller && root) {
			initialize({
				target: root,
				elements: {
					viewport: scroller,
				},
			});
		}

		return () => osInstance()?.destroy();
	}, [initialize, osInstance, ref, scroller]);

	return <BaseScrollbars ref={rootRef}>{cloneElement(props.children, { scrollerRef: setScroller })}</BaseScrollbars>;
});

export default memo(VirtualizedScrollbars);
