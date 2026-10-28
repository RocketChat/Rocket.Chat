import { Box } from '@rocket.chat/fuselage';
import type { ReactNode, Ref } from 'react';

type AppsListScrollAreaProps = {
	ref?: Ref<HTMLDivElement>;
	children: ReactNode;
};

/**
 * The scrolling region of the apps page that holds its app lists, above the pagination.
 */
const AppsListScrollArea = ({ ref, children }: AppsListScrollAreaProps) => (
	<Box display='flex' flexDirection='column' overflow='hidden' height='100%' paddingInline='x24'>
		<Box overflowY='scroll' height='100%' ref={ref}>
			{children}
		</Box>
	</Box>
);

export default AppsListScrollArea;
