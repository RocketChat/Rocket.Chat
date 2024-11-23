import type { Scrollable } from '@rocket.chat/fuselage';
import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import React, { forwardRef } from 'react';

import type { CustomScrollbarsProps } from '../CustomScrollbars';
import { CustomScrollbars } from '../CustomScrollbars';

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
			<CustomScrollbars onScroll={onScrollContent as CustomScrollbarsProps['onScroll']} ref={ref}>
				<Box paddingBlock={16} paddingInline={24} display='flex' flexDirection='column' {...props} />
			</CustomScrollbars>
		</Box>
	);
});

export default PageScrollableContent;
