import React, { MutableRefObject, CSSProperties, useMemo, memo, forwardRef } from 'react';
import { Scrollbars } from 'rc-scrollbars';

const styleDefault = {
	width: '100%',
	height: '100%',
	flexGrow: 1,
	willChange: 'transform',
	overflowY: 'hidden',
};

type CustomScrollbarsProps = {
	style?: CSSProperties;
	children?: React.ReactNode;
}

const ScrollableContentWrapper = forwardRef<HTMLElement | undefined, CustomScrollbarsProps>(({ children, style }, ref) => {
	const scrollbarsStyle = useMemo(() => ({ ...style, ...styleDefault }), [style]) as CSSProperties;

	return <Scrollbars
		autoHide
		autoHideTimeout={2000}
		autoHideDuration={500}
		style={scrollbarsStyle}
		renderView={
			({ style, ...props }): JSX.Element => (
				<div {...props} className='teste' style={{ ...style, overflowX: 'hidden' }} />
			)
		}
		renderTrackHorizontal={(props): JSX.Element => <div {...props} style={{ display: 'none' }} className='track-horizontal'/>}
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
