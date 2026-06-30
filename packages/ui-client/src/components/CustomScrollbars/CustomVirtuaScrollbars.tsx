import { useOverlayScrollbars } from 'overlayscrollbars-react';
import type { HTMLAttributes, ReactNode } from 'react';
import { useEffect, memo, forwardRef, useRef } from 'react';

import BaseScrollbars from './BaseScrollbars';

type CustomScrollbarsProps = {
	children: ReactNode;
} & Omit<HTMLAttributes<HTMLDivElement>, 'is' | 'onScroll'>;

const CustomVirtuaScrollbars = forwardRef<HTMLElement, CustomScrollbarsProps>(function CustomScrollbars({ ...props }, ref) {
	const rootRef = useRef<HTMLElement | null>(null);

	const [initialize] = useOverlayScrollbars({
		defer: true,
		events: {
			initialized(osInstance) {
				// force overflow styles
				const { viewport } = osInstance.elements();
				viewport.style.overflowX = `var(--os-viewport-overflow-x)`;
				viewport.style.overflowY = `var(--os-viewport-overflow-y)`;

				if (typeof ref === 'function') {
					ref(viewport);
				} else if (ref) {
					ref.current = viewport;
				}
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

	return <BaseScrollbars ref={rootRef} {...props} />;
});

export default memo(CustomVirtuaScrollbars);
