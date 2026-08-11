import { useOverlayScrollbars } from 'overlayscrollbars-react';
import type { HTMLAttributes, ReactNode, RefAttributes } from 'react';
import { useEffect, useRef, memo } from 'react';

import type { OverlayScrollbars } from '.';
import BaseScrollbars, { getScrollbarsOptions } from './BaseScrollbars';

export type CustomScrollbarsProps = {
	children: ReactNode;
	overflowX?: boolean;
	onScroll?: (args: OverlayScrollbars) => void;
} & Omit<HTMLAttributes<HTMLDivElement>, 'is' | 'onScroll'> &
	RefAttributes<HTMLElement>;

const CustomScrollbars = ({ overflowX, onScroll, ref, ...props }: CustomScrollbarsProps) => {
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
			initialize({ target: root });

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
};

export default memo(CustomScrollbars);
