import { Box } from '@rocket.chat/fuselage';
import React, { ComponentProps, forwardRef } from 'react';

const PageContent = forwardRef<HTMLElement, ComponentProps<typeof Box>>(function PageContent(
	props,
	ref,
) {
	return (
		<Box
			ref={ref}
			paddingInline='x24'
			display='flex'
			flexDirection='column'
			overflowY='hidden'
			height='full'
			{...props}
		/>
	);
});

export default PageContent;
