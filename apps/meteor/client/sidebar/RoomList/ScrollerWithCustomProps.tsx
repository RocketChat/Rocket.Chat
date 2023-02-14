import type { ReactElement } from 'react';
import React, { forwardRef } from 'react';

import ScrollableContentWrapper from '../../components/ScrollableContentWrapper';

export default forwardRef<HTMLDivElement>(function ScrollerWithCustomProps(props, ref): ReactElement {
	return (
		<ScrollableContentWrapper
			{...props}
			ref={ref}
			renderView={({ style, ...props }): ReactElement => <div {...props} style={{ ...style }} />}
			renderTrackHorizontal={(props): ReactElement => <div {...props} style={{ display: 'none' }} className='track-horizontal' />}
		/>
	);
});
