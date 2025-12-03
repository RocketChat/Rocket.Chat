import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { forwardRef } from 'react';

import type { OverlayScrollbars } from '../CustomScrollbars';
import { CustomScrollbars } from '../CustomScrollbars';

type PageScrollableContentProps = {
	onScroll?: (args: OverlayScrollbars) => void;
} & Omit<ComponentProps<typeof Box>, 'onScroll'>;

const PageScrollableContent = forwardRef<HTMLElement, PageScrollableContentProps>(function PageScrollableContent(
	{ onScroll, borderBlockEndColor, ...props },
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
			<CustomScrollbars onScroll={onScroll} ref={ref}>
				<Box paddingBlock={16} paddingInline={24} display='flex' flexDirection='column' {...props} />
			</CustomScrollbars>
		</Box>
	);
});

export default PageScrollableContent;
