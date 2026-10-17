import { useMergedRefs, useResizeObserver, useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useRef, useState, useEffect } from 'react';

import { Box, type BoxProps } from '../Box';

export type TabsProps = BoxProps & {
	divider?: boolean;
	scrollShadow?: boolean;
};

const getComputedDirection = (element: HTMLElement, props: TabsProps): 'rtl' | 'ltr' => {
	const win = element.ownerDocument.defaultView;
	let current: HTMLElement | null = element;
	while (current) {
		const dir = win?.getComputedStyle(current).direction;
		if (dir === 'rtl' || dir === 'ltr') {
			return dir;
		}
		if (current.getAttribute?.('dir') === 'rtl') {
			return 'rtl';
		}
		if (current.getAttribute?.('dir') === 'ltr') {
			return 'ltr';
		}
		current = current.parentElement;
	}
	if (
		props.dir === 'rtl' ||
		(typeof props.style === 'object' &&
			props.style !== null &&
			'direction' in props.style &&
			(props.style as { direction?: string }).direction === 'rtl')
	) {
		return 'rtl';
	}
	return 'ltr';
};

/**
 * Tabs is a component to navigate around the UI using buttons arranged together with the selected tab highlighted.
 */
function Tabs({ children, divider = true, scrollShadow = true, ...props }: TabsProps) {
	const scrollBoxRef = useRef<HTMLDivElement>(null);
	const { ref: scrollBoxResizeRef, borderBoxSize: scrollBoxSize } = useResizeObserver<HTMLDivElement>();
	const scrollBoxMergedRef = useMergedRefs(scrollBoxRef, scrollBoxResizeRef);

	const { ref: contentResizeRef, borderBoxSize: contentBoxSize } = useResizeObserver<HTMLDivElement>();

	const [isRtl, setIsRtl] = useState(() => {
		if (props.dir === 'rtl') {
			return true;
		}
		if (
			typeof props.style === 'object' &&
			props.style !== null &&
			'direction' in props.style &&
			(props.style as { direction?: string }).direction === 'rtl'
		) {
			return true;
		}
		return false;
	});

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

		const elementIsRtl = getComputedDirection(element, props) === 'rtl';
		setIsRtl(elementIsRtl);

		const { scrollLeft, clientWidth, scrollWidth } = element;

		const canScrollStart = elementIsRtl ? Math.abs(scrollLeft) > 1 : scrollLeft > 1;
		const canScrollEnd = elementIsRtl
			? Math.ceil(Math.abs(scrollLeft) + clientWidth) < scrollWidth - 1
			: Math.ceil(scrollLeft + clientWidth) < scrollWidth - 1;

		setOverflowStart(canScrollStart);
		setOverflowEnd(canScrollEnd);
	});

	const styleDirection =
		typeof props.style === 'object' && props.style !== null && 'direction' in props.style
			? (props.style as { direction?: string }).direction
			: undefined;

	useEffect(() => {
		checkOverflow();
	}, [checkOverflow, scrollBoxSize.inlineSize, contentBoxSize.inlineSize, children, scrollShadow, props.dir, styleDirection]);

	useEffect(() => {
		if (typeof document === 'undefined' || !('fonts' in document) || !document.fonts) {
			return;
		}

		let mounted = true;
		void document.fonts.ready.then(() => {
			if (mounted) {
				checkOverflow();
			}
		});
		return () => {
			mounted = false;
		};
	}, [checkOverflow]);

	return (
		<Box
			is='div'
			rcx-tabs
			rcx-tabs--with-divider={divider}
			rcx-tabs--overflow-start={scrollShadow && overflowStart}
			rcx-tabs--overflow-end={scrollShadow && overflowEnd}
			rcx-tabs--rtl={isRtl}
			{...props}
		>
			<div className='rcx-box rcx-box--full rcx-tabs__scroll-box' ref={scrollBoxMergedRef} onScroll={checkOverflow}>
				<div className='rcx-box rcx-box--full rcx-tabs__wrapper' ref={contentResizeRef} role='tablist'>
					{children}
				</div>
			</div>
		</Box>
	);
}

export default Tabs;
