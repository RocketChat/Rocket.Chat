import type { Box } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { forwardRef } from 'react';

import PageContent from './PageContent';

const PageBlock = forwardRef<HTMLElement, ComponentProps<typeof Box>>(function PageBlock(props, ref) {
	return <PageContent borderBlockEndColor='transparent' {...props} pb={16} ref={ref} borderBlockEndWidth='default' height='auto' />;
});

export default PageBlock;
