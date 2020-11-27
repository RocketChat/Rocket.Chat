import React, { useCallback } from 'react';
import SimpleBar from 'simplebar-react';
import 'simplebar/src/simplebar.css';

const CustomScrollbars = ({ onScroll, forwardedRef, children }) => {
	const refSetter = useCallback((scrollbarsRef) => {
		if (scrollbarsRef) {
			forwardedRef(scrollbarsRef.view);
		} else {
			forwardedRef(null);
		}
	}, []);

	return <SimpleBar ref={refSetter} style={{ maxHeight: '100%', flexGrow: 1 }} scrollableNodeProps={{ ref: forwardedRef, onScroll }} children={children}/>;
};


const ScrollableContentWrapper = React.forwardRef((props, ref) => <CustomScrollbars {...console.log(props)} {...props} forwardedRef={ref} />);

export default ScrollableContentWrapper;
