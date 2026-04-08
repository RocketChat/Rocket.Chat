import { useOverlayScrollbars } from 'overlayscrollbars-react';
import type { HTMLAttributes, ReactElement } from 'react';
import { useEffect, useRef, forwardRef, memo } from 'react';

import type { OverlayScrollbars } from '.';
import BaseScrollbars, { getScrollbarsOptions } from './BaseScrollbars';

type VirtualScrollbarsProps = {
	children: ReactElement;
	overflowX?: boolean;
	onScroll?: (args: OverlayScrollbars) => void;
} & Omit<HTMLAttributes<HTMLDivElement>, 'is' | 'onScroll'>;

const VirtualScrollbars = forwardRef<HTMLElement, VirtualScrollbarsProps>(function VirtualScrollbars(
	{ overflowX, onScroll, ...props },
	ref,
) {
	const rootRef = useRef(null);
	const scrollbarsOptions = getScrollbarsOptions(overflowX);
	const [initialize, osInstance] = useOverlayScrollbars({
		options: scrollbarsOptions,
		defer: true,
		events: {
			scroll: (args) => onScroll?.(args),
			initialized(osInstance) {
				const { viewport } = osInstance.elements();
				viewport.style.overflowX = `var(--os-viewport-overflow-x)`;
				viewport.style.overflowY = `var(--os-viewport-overflow-y)`;
				// Set the ref here, where the instance is guaranteed to exist
				if (ref) {
					if (typeof ref === 'function') {
						ref(viewport || null);
					} else {
						ref.current = viewport || null;
					}
				}
			},
		},
	});

	useEffect(() => {
		const { current: root } = rootRef;

		if (root) {
			initialize({
				target: root,
			});

			const instance = osInstance();
			if (!instance || !ref) {
				return;
			}
			if (typeof ref === 'function') {
				ref(instance.elements().viewport || null);
				return;
			}
			ref.current = instance.elements().viewport || null;
		}

		return () => osInstance()?.destroy();
	}, [initialize, osInstance, ref]);

	return <BaseScrollbars ref={rootRef} {...props} />;
});

export default memo(VirtualScrollbars);
