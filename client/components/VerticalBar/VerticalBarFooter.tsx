import { Box } from '@rocket.chat/fuselage';
import React, { forwardRef, memo } from 'react';

const VerticalBarFooter = forwardRef(function VerticalBarScrollableContent(
	{ children, ...props },
	ref,
) {
	return (
		<Box is='footer' p='x24' {...props} ref={ref}>
			{children}
		</Box>
	);
});

export default memo(VerticalBarFooter);
