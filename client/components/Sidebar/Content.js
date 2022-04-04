import { Box } from '@rocket.chat/fuselage';
import React from 'react';

import ScrollableContentWrapper from '../ScrollableContentWrapper';

const Content = ({ children, ...props }) => (
	<Box display='flex' flexDirection='column' flexGrow={1} flexShrink={1} overflow='hidden'>
		<ScrollableContentWrapper {...props}>
			<Box display='flex' flexDirection='column' w='full' h='full'>
				{children}
			</Box>
		</ScrollableContentWrapper>
	</Box>
);

export default Content;
