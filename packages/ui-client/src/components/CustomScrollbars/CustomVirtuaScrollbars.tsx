import { useOverlayScrollbars } from 'overlayscrollbars-react';
import type { HTMLAttributes, ReactNode, RefAttributes } from 'react';
import { useEffect, memo, useRef } from 'react';

import BaseScrollbars from './BaseScrollbars';

export type CustomScrollbarsProps = {
	children: ReactNode;
} & Omit<HTMLAttributes<HTMLDivElement>, 'is' | 'onScroll'> &
	RefAttributes<HTMLElement>;

const CustomVirtuaScrollbars = ({ ref, ...props }: CustomScrollbarsProps) => {
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
};

export default memo(CustomVirtuaScrollbars);
