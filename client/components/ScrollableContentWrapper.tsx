import React, { CSSProperties, FC, useMemo } from 'react';
import SimpleBar from 'simplebar-react';
import 'simplebar/src/simplebar.css';

import { useDir } from '../hooks/useDir';


const styleDefault = {
	maxHeight: '100%', flexGrow: 1, overflowY: 'auto', willChange: 'transform',
};

type CustomScrollbarsProps = {
	onScroll?: Function;
	ref: React.Ref<unknown>;
	style?: CSSProperties;
}

const ScrollableContentWrapper: FC<CustomScrollbarsProps> = React.memo(React.forwardRef(({ onScroll, children, style }, ref) => {
	const dir = useDir();
	const simpleBarStyle: CSSProperties = useMemo(() => ({ ...style, ...styleDefault }), [style]) as CSSProperties;
	return <SimpleBar data-simplebar-direction={dir} direction={dir} style={simpleBarStyle} scrollableNodeProps={{ ref, onScroll }} children={children}/>;
}));

export default ScrollableContentWrapper;
