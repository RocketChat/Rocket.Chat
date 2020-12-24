import { Box, BoxProps } from '@rocket.chat/fuselage';
import React, { forwardRef } from 'react';

type PageContentProps = BoxProps;

const PageContent = forwardRef<HTMLElement, PageContentProps>((props, ref) => (
	<Box
		ref={ref}
		paddingInline='x24'
		display='flex'
		flexDirection='column'
		overflowY='hidden'
		height='full'
		{...props}
	/>
));

export default PageContent;
