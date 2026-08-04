import type { BoxProps } from '@rocket.chat/fuselage';
import { forwardRef } from 'react';

import PageContent from './PageContent';

const PageBlock = forwardRef<HTMLElement, BoxProps>(function PageBlock(props, ref) {
	return (
		<PageContent borderBlockEndColor='transparent' {...props} paddingBlock={16} ref={ref} borderBlockEndWidth='default' height='auto' />
	);
});

export default PageBlock;
