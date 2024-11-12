import type { MutableRefObject, CSSProperties, ReactNode } from 'react';
import React, { memo, forwardRef, useCallback, useMemo, useEffect } from 'react';

export type NativeScrollBarsProps = {
	overflowX?: boolean;
	style?: CSSProperties;
	children?: ReactNode;
	onScroll?: (values: any) => void;
	autoHide?: boolean;
};

const styleDefault: CSSProperties = {
	flexGrow: 1,
	overflowY: 'hidden',
};

const NativeScrollbars = forwardRef<HTMLElement, NativeScrollBarsProps>(function NativeScrollbars(
	{ children, style, onScroll, ...props },
	ref,
) {
	const scrollbarsStyle = useMemo(() => ({ ...style, ...styleDefault }), [style]);

	const refSetter = useCallback(
		(scrollBarElement) => {
			if (ref && scrollBarElement) {
				if (typeof ref === 'function') {
					console.log(scrollBarElement ?? null);
					ref(scrollBarElement ?? null);
					return;
				}

				(ref as MutableRefObject<HTMLElement | undefined>).current = scrollBarElement;
			}
		},
		[ref],
	);

	useEffect(() => {
		if (onScroll) {
			console.log(`onScroll`);
			const scrollBarElement = ref as MutableRefObject<HTMLElement>;
			const handleScroll = () => {
				if (scrollBarElement?.current) {
					const values = {
						left: scrollBarElement.current.scrollLeft,
						top: scrollBarElement.current.scrollTop,
						scrollLeft: scrollBarElement.current.scrollLeft,
						scrollTop: scrollBarElement.current.scrollTop,
						scrollWidth: scrollBarElement.current.scrollWidth,
						scrollHeight: scrollBarElement.current.scrollHeight,
						clientWidth: scrollBarElement.current.clientWidth,
						clientHeight: scrollBarElement.current.clientHeight,
					};

					onScroll(values);
				}
			};

			handleScroll();

			scrollBarElement.current?.addEventListener('scroll', handleScroll);
			return () => {
				scrollBarElement.current?.removeEventListener('scroll', handleScroll);
			};
		}
	}, [onScroll, ref]);

	return (
		<div
			ref={refSetter}
			className='rc-scrollbars-native'
			style={{
				position: 'absolute',
				width: '100%',
				height: '100%',
				...scrollbarsStyle,
			}}
			{...props}
		>
			{children}
		</div>
	);
});

export default memo(NativeScrollbars);
