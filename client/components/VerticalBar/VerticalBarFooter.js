import { Box, Margins } from '@rocket.chat/fuselage';
import React, { forwardRef, memo } from 'react';

const VerticalBarFooter = forwardRef(({ children, ...props }, ref) => (
	<Box is='footer' p='x24' {...props} ref={ref}>
		<Margins blockEnd='x16'>{children}</Margins>
	</Box>
));
VerticalBarFooter.displayName = 'VerticalBarFooter';

export default memo(VerticalBarFooter);
