import { Box } from '@rocket.chat/fuselage';
import React, { ComponentProps, forwardRef, useContext } from 'react';

import PageContent from './PageContent';
import PageContext from './PageContext';

const PageBlockWithBorder = forwardRef<HTMLElement, ComponentProps<typeof Box>>(function PageBlockWithBorder(props, ref) {
	const [border] = useContext(PageContext);
	return (
		<PageContent
			{...props}
			pb='x16'
			ref={ref}
			borderBlockEndColor={border ? 'neutral-200' : 'transparent'}
			borderBlockEndWidth='x2'
			height='auto'
		/>
	);
});

export default PageBlockWithBorder;
