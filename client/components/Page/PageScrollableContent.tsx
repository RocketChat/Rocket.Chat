import { Box, ScrollableProps } from '@rocket.chat/fuselage';
import React, { forwardRef } from 'react';

import ScrollableContentWrapper, { CustomScrollbarsProps } from '../ScrollableContentWrapper';

type PageScrollableContentProps = {
	onScrollContent?: ScrollableProps['onScrollContent'];
};

const PageScrollableContent = forwardRef<HTMLElement, PageScrollableContentProps>(
	function PageScrollableContent({ onScrollContent, ...props }, ref) {
		return (
			<Box display='flex' flexShrink={1} flexDirection='column' flexGrow={1} overflow='hidden'>
				<ScrollableContentWrapper
					onScroll={onScrollContent as CustomScrollbarsProps['onScroll']}
					ref={ref as any}
				>
					<Box p='x16' display='flex' flexDirection='column' flexGrow={1} {...props} />
				</ScrollableContentWrapper>
			</Box>
		);
	},
);

export default PageScrollableContent;
