import React, { useCallback } from 'react';
import SimpleBar from 'simplebar-react';
import 'simplebar/src/simplebar.css';

import { useDir } from '../../hooks/useDir';

const style = {
	maxHeight: '100%', flexGrow: 1,
};

const CustomScrollbars = React.memo(({ onScroll, forwardedRef, children }) => {
	const dir = useDir();

	const refSetter = useCallback((scrollbarsRef) => {
		if (scrollbarsRef) {
			forwardedRef(scrollbarsRef.view);
		} else {
			forwardedRef(null);
		}
	}, []);

	return <SimpleBar timeout={1000} data-simplebar-direction={dir} direction={dir} ref={refSetter} style={style} scrollableNodeProps={{ ref: forwardedRef, onScroll }} children={children}/>;
});


const ScrollableContentWrapper = React.forwardRef((props, ref) => <CustomScrollbars {...props} forwardedRef={ref} />);

export default ScrollableContentWrapper;
