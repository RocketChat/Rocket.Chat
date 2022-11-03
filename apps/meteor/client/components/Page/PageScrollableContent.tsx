import { Box, Scrollable } from '@rocket.chat/fuselage';
import React, { forwardRef, ComponentProps } from 'react';

import ScrollableContentWrapper, { CustomScrollbarsProps } from '../ScrollableContentWrapper';

type PageScrollableContentProps = {
	onScrollContent?: ComponentProps<typeof Scrollable>['onScrollContent'];
} & ComponentProps<typeof Box>;

const PageScrollableContent = forwardRef<HTMLElement, PageScrollableContentProps>(function PageScrollableContent(
	{ onScrollContent, borderBlockEndColor, ...props },
	ref,
) {
	return (
		<Box
			height='50vh'
			display='flex'
			flexShrink={1}
			flexDirection='column'
			flexGrow={1}
			overflow='hidden'
			borderBlockEndColor={borderBlockEndColor}
		>
			<ScrollableContentWrapper onScroll={onScrollContent as CustomScrollbarsProps['onScroll']} ref={ref as any}>
				<Box paddingBlock={16} paddingInline={24} display='flex' flexDirection='column' flexGrow={1} {...props} />
			</ScrollableContentWrapper>
		</Box>
	);
});

export default PageScrollableContent;
