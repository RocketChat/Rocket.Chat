import { Box, BoxProps } from '@rocket.chat/fuselage';
import React, { FC, useState } from 'react';

import PageContext from './PageContext';

type PageProps = BoxProps;

const Page: FC<PageProps> = (props) => {
	const [border, setBorder] = useState(false);
	return <PageContext.Provider value={[border, setBorder]}>
		<Box
			backgroundColor='surface'
			is='section'
			display='flex'
			flexDirection='column'
			flexGrow={1}
			flexShrink={1}
			height='full'
			overflow='hidden'
			{...props}
		/>
	</PageContext.Provider>;
};

export default Page;
