import { Palette } from '@rocket.chat/fuselage';
import type { ScrollValues } from 'rc-scrollbars';
import { Scrollbars } from 'rc-scrollbars';
import type { MutableRefObject, CSSProperties, ReactNode } from 'react';
import React, { memo, forwardRef, useCallback, useMemo, useEffect } from 'react';

export type CustomScrollbarsProps = {
	overflowX?: boolean;
	style?: CSSProperties;
	children?: ReactNode;
	onScroll?: (values: ScrollValues) => void;
	renderView?: typeof Scrollbars.defaultProps.renderView;
	renderTrackHorizontal?: typeof Scrollbars.defaultProps.renderTrackHorizontal;
	autoHide?: boolean;
	direction?: 'rtl' | 'ltr';
};

const styleDefault: CSSProperties = {
	flexGrow: 1,
	willChange: 'transform',
	overflowY: 'hidden',
};

const CustomScrollbars = forwardRef<HTMLElement, CustomScrollbarsProps>(function CustomScrollbars(
	{ children, style, onScroll, overflowX, renderView, direction, ...props },
	ref,
) {
	const scrollbarsStyle = useMemo(() => ({ ...style, ...styleDefault }), [style]);

	const refSetter = useCallback(
		(scrollbarRef) => {
			if (ref && scrollbarRef) {
				if (typeof ref === 'function') {
					ref(scrollbarRef.view ?? null);
					return;
				}

				(ref as MutableRefObject<HTMLElement | undefined>).current = scrollbarRef.view;
			}
		},
		[ref],
	);

	// Apply styles to hide the default scrollbar when the component mounts
	useEffect(() => {
		const root = document.documentElement;
		root.style.overflow = 'hidden';
		return () => {
			root.style.overflow = ''; // Reset when component unmounts
		};
	}, []);

	return (
		<Scrollbars
			{...props}
			autoHide
			autoHideTimeout={2000}
			autoHideDuration={500}
			style={{ ...scrollbarsStyle, direction: direction || 'ltr' }} // Apply direction style
			onScrollFrame={onScroll}
			renderView={renderView}
			renderTrackHorizontal={overflowX ? undefined : (props) => <div {...props} className='track-horizontal' style={{ display: 'none' }} />}
			renderThumbVertical={({ style, ...props }) => (
				<div {...props} style={{ ...style, backgroundColor: Palette.stroke['stroke-dark'].toString(), borderRadius: '4px' }} />
			)}
			children={children}
			ref={refSetter}
		/>
	);
});

export default memo(CustomScrollbars);
