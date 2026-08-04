import { useOverlayScrollbars } from 'overlayscrollbars-react';
import type { HTMLAttributes, ReactElement, RefAttributes } from 'react';
import { useEffect, useState, useRef, cloneElement, memo } from 'react';

import BaseScrollbars, { getScrollbarsOptions } from './BaseScrollbars';

export type VirtualizedScrollbarsProps = {
	overflowX?: boolean;
	children: ReactElement<any>;
} & Omit<HTMLAttributes<HTMLDivElement>, 'is'> &
	RefAttributes<HTMLElement>;

const VirtualizedScrollbars = ({ overflowX, ref, ...props }: VirtualizedScrollbarsProps) => {
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

	return <BaseScrollbars ref={rootRef}>{cloneElement(props.children, { tabIndex: -1, scrollerRef: setScroller })}</BaseScrollbars>;
};

export default memo(VirtualizedScrollbars);
