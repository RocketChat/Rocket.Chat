import { useOverlayScrollbars } from 'overlayscrollbars-react';
import type { HTMLAttributes, ReactElement } from 'react';
import { useEffect, useRef, forwardRef, memo } from 'react';

import type { OverlayScrollbars } from '.';
import BaseScrollbars, { getScrollbarsOptions } from './BaseScrollbars';

type CustomScrollbarsProps = {
	children: ReactElement;
	overflowX?: boolean;
	onScroll?: (args: OverlayScrollbars) => void;
} & Omit<HTMLAttributes<HTMLDivElement>, 'is' | 'onScroll'>;

const CustomScrollbars = forwardRef<HTMLElement, CustomScrollbarsProps>(function CustomScrollbars({ overflowX, onScroll, ...props }, ref) {
	const rootRef = useRef(null);
	const scrollbarsOptions = getScrollbarsOptions(overflowX);
	const [initialize, osInstance] = useOverlayScrollbars({
		options: scrollbarsOptions,
		events: {
			scroll: (args) => onScroll?.(args),
		},
	});

	useEffect(() => {
		const { current: root } = rootRef;

		if (root) {
			initialize(root);

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

export default memo(CustomScrollbars);
