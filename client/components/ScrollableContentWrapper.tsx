import React, { MutableRefObject, CSSProperties, useMemo, memo, forwardRef } from 'react';
import { Scrollbars, ScrollValues } from 'rc-scrollbars';

const styleDefault = {
	width: '100%',
	height: '100%',
	flexGrow: 1,
	willChange: 'transform',
	overflowY: 'hidden',
};

export type CustomScrollbarsProps = {
	style?: CSSProperties;
	children?: React.ReactNode;
	onScroll?: (values: ScrollValues) => void;
	renderView?: typeof Scrollbars.defaultProps.renderView;
	renderTrackHorizontal?: typeof Scrollbars.defaultProps.renderTrackHorizontal;
}

const ScrollableContentWrapper = forwardRef<HTMLElement, CustomScrollbarsProps>(({ children, style, onScroll, renderView, renderTrackHorizontal }, ref) => {
	const scrollbarsStyle = useMemo(() => ({ ...style, ...styleDefault }), [style]) as CSSProperties;

	return <Scrollbars
		autoHide
		autoHideTimeout={2000}
		autoHideDuration={500}
		style={scrollbarsStyle}
		onScrollFrame={onScroll}
		renderView={renderView}
		renderTrackHorizontal={renderTrackHorizontal}
		renderThumbVertical={
			({ style, ...props }): JSX.Element => (
				<div
					{...props}
					style={{ ...style, backgroundColor: 'rgba(0, 0, 0, 0.5)', borderRadius: '7px' }}
				/>
			)
		}
		children={children}
		ref={
			(sRef): void => {
				if (ref && sRef) {
					if (typeof ref === 'function') {
						ref(sRef.view ?? null);
						return;
					}

					(ref as MutableRefObject<HTMLElement | undefined>).current = sRef.view;
				}
			}
		}
	/>;
});

export default memo(ScrollableContentWrapper);
