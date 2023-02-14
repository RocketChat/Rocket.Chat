import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import React, { forwardRef, memo } from 'react';

const VerticalBarFooter = forwardRef<HTMLElement, ComponentProps<typeof Box>>(function VerticalBarFooter({ children, ...props }, ref) {
	return (
		<Box is='footer' p='x24' {...props} ref={ref}>
			{children}
		</Box>
	);
});

export default memo(VerticalBarFooter);
