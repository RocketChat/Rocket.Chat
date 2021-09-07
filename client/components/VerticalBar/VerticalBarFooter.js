import { Box, Margins } from '@rocket.chat/fuselage';
import React, { forwardRef, memo } from 'react';

const VerticalBarFooter = forwardRef(function VerticalBarFooter({ children, ...props }, ref) {
	return (
		<Box is='footer' p='x24' {...props} ref={ref}>
			<Margins blockEnd='x16'>{children}</Margins>
		</Box>
	);
});

export default memo(VerticalBarFooter);
