import React, { forwardRef } from 'react';

import ScrollableContentWrapper from '../../components/ScrollableContentWrapper';

const ScrollerWithCustomProps = forwardRef(function ScrollerWithCustomProps(props, ref) {
	return (
		<ScrollableContentWrapper
			{...props}
			ref={ref}
			renderView={({ style, ...props }) => <div {...props} style={{ ...style }} />}
			renderTrackHorizontal={(props) => <div {...props} style={{ display: 'none' }} className='track-horizontal' />}
		/>
	);
});

export default ScrollerWithCustomProps;
