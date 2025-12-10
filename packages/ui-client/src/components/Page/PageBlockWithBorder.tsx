import type { Box } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { forwardRef, useContext } from 'react';

import PageBlock from './PageBlock';
import PageContext from './PageContext';

const PageBlockWithBorder = forwardRef<HTMLElement, ComponentProps<typeof Box>>(function PageBlockWithBorder(props, ref) {
	const [border] = useContext(PageContext);
	return <PageBlock ref={ref} {...props} borderBlockEndColor={border ? 'extra-light' : 'transparent'} />;
});

export default PageBlockWithBorder;
