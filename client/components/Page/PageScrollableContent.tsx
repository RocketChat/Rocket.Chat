import { Box, ScrollableProps } from '@rocket.chat/fuselage';
import React, { forwardRef } from 'react';

import ScrollableContentWrapper from '../ScrollableContentWrapper';

type PageScrollableContentProps = {
	onScrollContent?: ScrollableProps['onScrollContent'];
};

const PageScrollableContent = forwardRef<HTMLElement, PageScrollableContentProps>(({
	onScrollContent,
	...props
}, ref) => (
	<Box display='flex' flexShrink={1} flexGrow={1} overflow='hidden'>
		<ScrollableContentWrapper ref={ref} onScroll={onScrollContent}>
			<Box p='x16' display='flex' flexDirection='column' flexGrow={1} {...props} />
		</ScrollableContentWrapper>
	</Box>
));

export default PageScrollableContent;
