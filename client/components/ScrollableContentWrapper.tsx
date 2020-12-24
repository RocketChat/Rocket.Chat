import React, { CSSProperties, PropsWithChildren, useMemo, memo, forwardRef } from 'react';
import SimpleBar from 'simplebar-react';
import 'simplebar/src/simplebar.css';

import { useDir } from '../hooks/useDir';

const styleDefault = {
	maxHeight: '100%',
	flexGrow: 1,
	overflowY: 'auto',
	willChange: 'transform',
} as const;

type ScrollableContentWrapperProps = PropsWithChildren<{
	onScroll?: Function;
	style?: CSSProperties;
}>;

const ScrollableContentWrapper = forwardRef<HTMLElement, ScrollableContentWrapperProps>(({
	children,
	style,
	onScroll,
}, ref) => {
	const dir = useDir();
	const simpleBarStyle = useMemo(() => ({ ...style, ...styleDefault }), [style]) as CSSProperties;
	return <SimpleBar
		data-simplebar-direction={dir}
		direction={dir}
		style={simpleBarStyle}
		scrollableNodeProps={{ ref, onScroll }}
		children={children}
	/>;
});

export default memo(ScrollableContentWrapper);
