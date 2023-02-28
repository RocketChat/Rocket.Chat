import type { ComponentProps, ReactElement, Ref } from 'react';
import React, { forwardRef } from 'react';

import ScrollableContentWrapper from '../../components/ScrollableContentWrapper';

type ScrollerWithCustomPropsProps = ComponentProps<typeof ScrollableContentWrapper>;

export default forwardRef(function ScrollerWithCustomProps(
	{ style, ...props }: ScrollerWithCustomPropsProps,
	ref: Ref<HTMLDivElement>,
): ReactElement {
	return (
		<ScrollableContentWrapper
			{...props}
			style={{ ...style, flexGrow: 1, overflowY: 'hidden', width: '100%', willChange: 'transform' }}
			ref={ref}
			renderView={({ style, ...props }): ReactElement => <div {...props} style={{ ...style }} />}
			renderTrackHorizontal={(props): ReactElement => <div {...props} style={{ display: 'none' }} className='track-horizontal' />}
		/>
	);
});
