import { Box } from '@rocket.chat/fuselage';
import type { ReactNode, Ref } from 'react';

type AppsListScrollerProps = {
	ref?: Ref<HTMLDivElement>;
	children: ReactNode;
};

/**
 * The scrolling column of the apps page's lists, inset to line up with the page header.
 */
const AppsListScroller = ({ ref, children }: AppsListScrollerProps) => (
	<Box ref={ref} overflowY='scroll' height='100%' marginInline='x24' paddingBlockEnd='x16' display='flex' flexDirection='column' gap='x16'>
		{children}
	</Box>
);

export default AppsListScroller;
