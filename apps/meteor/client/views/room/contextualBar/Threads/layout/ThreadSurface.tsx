import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type ThreadSurfaceProps = {
	/** The thread is laid over the room, wider than the contextual bar. */
	expanded?: boolean;
	children: ReactNode;
};

const expandedWidth = css`
	max-width: 855px !important;
	@media (min-width: 780px) and (max-width: 1135px) {
		max-width: calc(100% - var(--sidebar-width)) !important;
	}
`;

/**
 * The contextual bar's surface for the thread view, which lays itself over the room instead of sitting in a
 * `Contextualbar`.
 */
const ThreadSurface = ({ expanded, children }: ThreadSurfaceProps) => (
	<Box
		rcx-vertical-bar
		rcx-thread-view
		className={expanded ? expandedWidth : undefined}
		backgroundColor='room'
		color='default'
		display='flex'
		flexDirection='column'
		flexShrink={0}
		width='100%'
		height='full'
		position='absolute'
		insetInlineEnd='none'
		insetBlock={0}
		zIndex={100}
		overflow='hidden'
	>
		{children}
	</Box>
);

export default ThreadSurface;
