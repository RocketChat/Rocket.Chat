import type { ScrollValues } from 'rc-scrollbars';
import { Scrollbars } from 'rc-scrollbars';
import type { MutableRefObject, CSSProperties, ReactNode, ReactElement } from 'react';
import React, { memo, forwardRef, useCallback } from 'react';

export type CustomScrollbarsProps = {
	overflowX?: boolean;
	style?: CSSProperties;
	children?: ReactNode;
	onScroll?: (values: ScrollValues) => void;
	renderView?: typeof Scrollbars.defaultProps.renderView;
	renderTrackHorizontal?: typeof Scrollbars.defaultProps.renderTrackHorizontal;
	autoHide?: boolean;
};

const CustomScrollbars = forwardRef<HTMLElement, CustomScrollbarsProps>(function CustomScrollbars(
	{ children, onScroll, overflowX, renderView, ...props },
	ref,
) {
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

	return (
		<Scrollbars
			{...props}
			autoHide
			autoHideTimeout={2000}
			autoHideDuration={500}
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

export default memo(CustomScrollbars);
