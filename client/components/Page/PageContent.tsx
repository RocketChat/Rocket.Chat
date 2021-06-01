import { Box } from '@rocket.chat/fuselage';
import React, { forwardRef, ReactNode } from 'react';

type PageContentProps = {
	children: ReactNode;
};

const PageContent = forwardRef<HTMLElement, PageContentProps>(function PageContent(props, ref) {
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
