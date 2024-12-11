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
};

const styleDefault: CSSProperties = {
	flexGrow: 1,
  willChange: 'transform',
	overflowY: 'hidden'
};

// Styles to hide the default scrollbar
const hideScrollbarStyle = `
	[dir="rtl"] {
		overflow: hidden;
	}

	[dir="rtl"] ::-webkit-scrollbar {
		display: none;
	}
`;

const CustomScrollbars = forwardRef<HTMLDivElement, CustomScrollbarsProps>(function CustomScrollbars(
	{ children, style, onScroll, overflowX, renderView, ...props },
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
				(ref as MutableRefObject<HTMLDivElement | undefined>).current = scrollbarRef.view;
			}
		},
		[ref],
	);

	// Dynamically using the hide scrollbar style to hide default scrollbar

	useEffect(() => {
		const styleElement = document.createElement('style');
		styleElement.innerHTML = hideScrollbarStyle;
		document.head.appendChild(styleElement);

		return () => {
			document.head.removeChild(styleElement);
		};
	}, []);

	return (
		<Scrollbars
			{...props}
			autoHide
			autoHideTimeout={2000}
			autoHideDuration={500}
			style={scrollbarsStyle}
			onScrollFrame={onScroll}
			renderView={renderView}
			renderTrackHorizontal={overflowX ? undefined : (trackProps) => <div {...trackProps} className='track-horizontal' style={{ display: 'none' }} />}
			renderThumbVertical={({ style, ...props }) => (
				<div {...props} style={{ ...style, backgroundColor: Palette.stroke['stroke-dark'].toString(), borderRadius: '4px' }} />
			)}
			children={children}
			ref={refSetter}
		/>
	);
});

export default memo(CustomScrollbars);
