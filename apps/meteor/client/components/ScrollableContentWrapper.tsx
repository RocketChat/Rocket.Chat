import type { ScrollValues } from 'rc-scrollbars';
import { Scrollbars } from 'rc-scrollbars';
import type { MutableRefObject, CSSProperties, ReactNode, ReactElement } from 'react';
import React, { useMemo, memo, forwardRef, useCallback } from 'react';

const styleDefault: CSSProperties = {
	width: '100%',
	height: '100%',
	flexGrow: 1,
	willChange: 'transform',
	overflowY: 'hidden',
};

export type CustomScrollbarsProps = {
	overflowX?: boolean;
	style?: CSSProperties;
	children?: ReactNode;
	onScroll?: (values: ScrollValues) => void;
	renderView?: typeof Scrollbars.defaultProps.renderView;
	renderTrackHorizontal?: typeof Scrollbars.defaultProps.renderTrackHorizontal;
	autoHide?: boolean;
};

const ScrollableContentWrapper = forwardRef<HTMLElement, CustomScrollbarsProps>(function ScrollableContentWrapper(
	{ children, style, onScroll, overflowX, renderView, ...props },
	ref,
) {
	const scrollbarsStyle = useMemo((): CSSProperties => ({ ...style, ...styleDefault }), [style]);

	const refSetter = useCallback(
		(scrollbarRef) => {
			console.log(ref);
			if (ref && scrollbarRef) {
				if (typeof ref === 'function') {
					ref(scrollbarRef.container ?? null);
					return;
				}

				(ref as MutableRefObject<HTMLElement | undefined>).current = scrollbarRef.container;
			}
		},
		[ref],
	);

	return (
		<Scrollbars
			{...props}
			autoHide
			autoHideTimeout={2000}
			autoHideDuration={500}
			style={scrollbarsStyle}
			onScrollFrame={onScroll}
			renderView={renderView}
			renderTrackHorizontal={
				overflowX ? undefined : (props): ReactElement => <div {...props} className='track-horizontal' style={{ display: 'none' }} />
			}
			renderThumbVertical={({ style, ...props }): JSX.Element => (
				<div {...props} style={{ ...style, backgroundColor: 'rgba(0, 0, 0, 0.5)', borderRadius: '7px' }} />
			)}
			children={children}
			ref={refSetter}
		/>
	);
});

export default memo(ScrollableContentWrapper);
