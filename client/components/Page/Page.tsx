import { Box } from '@rocket.chat/fuselage';
import React, { useState, FC } from 'react';

import PageContext from './PageContext';

const Page: FC = (props) => {
	const [border, setBorder] = useState(false);
	return (
		<PageContext.Provider value={[border, setBorder]}>
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
		</PageContext.Provider>
	);
};

export default Page;
