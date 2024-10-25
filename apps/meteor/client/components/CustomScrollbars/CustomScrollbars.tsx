import { css } from '@rocket.chat/css-in-js';
import { Box, Palette } from '@rocket.chat/fuselage';
import { useMergedRefs } from '@rocket.chat/fuselage-hooks';
import { useOverlayScrollbars } from 'overlayscrollbars-react';
import type { HTMLAttributes, ReactElement } from 'react';
import React, { useEffect, useState, useRef, cloneElement, forwardRef, memo } from 'react';

import 'overlayscrollbars/styles/overlayscrollbars.css';

type CustomScrollbarsProps = {
	children: ReactElement;
	virtualized?: boolean;
	overflowX?: boolean;
} & Omit<HTMLAttributes<HTMLDivElement>, 'is'>;

const CustomScrollbars = forwardRef<HTMLElement, CustomScrollbarsProps>(function Virtualized(
	{ virtualized = false, overflowX, ...props },
	ref,
) {
	const rootRef = useRef(null);
	const mergedRefs = useMergedRefs(rootRef, ref);
	const [scroller, setScroller] = useState(null);
	const [initialize, osInstance] = useOverlayScrollbars({
		options: { scrollbars: { autoHide: 'scroll' }, overflow: { x: overflowX ? 'scroll' : 'hidden' } },
		defer: true,
	});

	useEffect(() => {
		const { current: root } = rootRef;

		if (scroller && root) {
			return initialize({
				target: root,
				elements: {
					viewport: scroller,
				},
			});
		}

		if (root) {
			initialize(root);
		}

		return () => osInstance()?.destroy();
	}, [scroller, initialize, osInstance]);

	return (
		<Box
			className={css`
				.os-scrollbar {
					--os-handle-bg: ${Palette.stroke['stroke-dark']};
					--os-handle-bg-hover: ${Palette.stroke['stroke-dark']};
					--os-handle-bg-active: ${Palette.stroke['stroke-dark']};
				}
			`}
			height='full'
			data-overlayscrollbars-initialize=''
			ref={mergedRefs}
			{...props}
		>
			{cloneElement(props.children, virtualized ? { scrollerRef: setScroller } : undefined)}
		</Box>
	);
});

export default memo(CustomScrollbars);
