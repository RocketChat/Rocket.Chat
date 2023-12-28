import type { Box } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import React, { forwardRef, useContext } from 'react';

import PageContent from './PageContent';
import PageContext from './PageContext';

const PageBlockWithBorder = forwardRef<HTMLElement, ComponentProps<typeof Box>>(function PageBlockWithBorder(props, ref) {
	const [border] = useContext(PageContext);
	return (
		<PageContent
			{...props}
			pb={16}
			ref={ref}
			borderBlockEndColor={border ? 'extra-light' : 'transparent'}
			borderBlockEndWidth='default'
			height='auto'
		/>
	);
});

export default PageBlockWithBorder;
