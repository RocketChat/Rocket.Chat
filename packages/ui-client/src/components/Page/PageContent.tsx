import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { forwardRef } from 'react';

const PageContent = forwardRef<HTMLElement, ComponentProps<typeof Box>>(function PageContent(props, ref) {
	return <Box ref={ref} paddingInline={24} display='flex' flexDirection='column' overflowY='hidden' height='full' {...props} />;
});

export default PageContent;
