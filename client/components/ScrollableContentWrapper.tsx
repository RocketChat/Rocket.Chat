import React, { CSSProperties, forwardRef, memo, PropsWithChildren } from 'react';
import SimpleBar from 'simplebar-react';
import 'simplebar/src/simplebar.css';

import { useDir } from '../hooks/useDir';

const styleDefault = {
	maxHeight: '100%',
	flexGrow: 1,
} as const;

type ScrollableContentWrapperProps = PropsWithChildren<{
	onScroll?: Function;
	style?: CSSProperties;
}>;

const ScrollableContentWrapper = forwardRef<HTMLElement, ScrollableContentWrapperProps>(({
	children,
	style = styleDefault,
	onScroll,
}, ref) => {
	const dir = useDir();
	return <SimpleBar
		data-simplebar-direction={dir}
		direction={dir}
		style={style}
		scrollableNodeProps={{ ref, onScroll }}
		children={children}
	/>;
});

export default memo(ScrollableContentWrapper);
