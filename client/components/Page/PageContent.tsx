import { Box } from '@rocket.chat/fuselage';
import React, { forwardRef, ComponentProps, Ref } from 'react';

type PageContentProps = ComponentProps<typeof Box>;

const PageContent = forwardRef(function PageContent(props: PageContentProps, ref: Ref<Element>) {
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
