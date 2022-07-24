import { Box } from '@rocket.chat/fuselage';
import React, { forwardRef, ComponentProps, memo } from 'react';

const VerticalBarFooter = forwardRef<HTMLElement, ComponentProps<typeof Box>>(function VerticalBarFooter({ children, ...props }, ref) {
	return (
		<Box is='footer' p='x24' {...props} ref={ref}>
			{children}
		</Box>
	);
});

export default memo(VerticalBarFooter);
