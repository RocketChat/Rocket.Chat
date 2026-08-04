import type { BoxProps } from '@rocket.chat/fuselage';
import { Box } from '@rocket.chat/fuselage';
import { forwardRef } from 'react';

const PageContent = forwardRef<HTMLElement, BoxProps>(function PageContent(props, ref) {
	return <Box ref={ref} paddingInline={24} display='flex' flexDirection='column' overflowY='hidden' height='full' {...props} />;
});

export default PageContent;
