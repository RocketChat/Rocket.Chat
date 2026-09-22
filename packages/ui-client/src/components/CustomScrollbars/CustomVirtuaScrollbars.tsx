import { useOverlayScrollbars } from 'overlayscrollbars-react';
import type { HTMLAttributes, ReactNode } from 'react';
import { useEffect, memo, forwardRef, useRef, useState } from 'react';

import BaseScrollbars, { getScrollbarsOptions } from './BaseScrollbars';

export type CustomScrollbarsProps = {
	children: ReactNode;
} & Omit<HTMLAttributes<HTMLDivElement>, 'is' | 'onScroll'>;

const CustomVirtuaScrollbars = forwardRef<HTMLElement, CustomScrollbarsProps>(function CustomScrollbars({ ...props }, ref) {
	const rootRef = useRef<HTMLElement | null>(null);
	const [viewport, setViewport] = useState<HTMLElement | null>(null);

	const [initialize] = useOverlayScrollbars({
		options: getScrollbarsOptions(),
		defer: true,
		events: {
			initialized(osInstance) {
				// force overflow styles
				const { viewport } = osInstance.elements();
				viewport.style.overflowX = `var(--os-viewport-overflow-x)`;
				viewport.style.overflowY = `var(--os-viewport-overflow-y)`;

				setViewport(viewport);
			},
		},
	});

	useEffect(() => {
		const { current: root } = rootRef;

		if (root?.firstElementChild && root.firstElementChild instanceof HTMLElement) {
			initialize({
				target: root,
				elements: {
					viewport: root.firstElementChild,
				},
			});
		}
	}, [initialize]);

	useEffect(() => {
		if (!viewport || !ref) {
			return;
		}

		if (typeof ref === 'function') {
			const cleanup = ref(viewport);
			return typeof cleanup === 'function' ? cleanup : () => ref(null);
		}

		ref.current = viewport;
		return () => {
			ref.current = null;
		};
	}, [ref, viewport]);

	return <BaseScrollbars ref={rootRef} {...props} />;
});

export default memo(CustomVirtuaScrollbars);
