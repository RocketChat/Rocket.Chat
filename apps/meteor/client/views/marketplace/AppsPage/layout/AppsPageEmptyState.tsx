import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type AppsPageEmptyStateProps = {
	offset: 'x20' | 'x24' | 'x64';
	children: ReactNode;
};

/**
 * Places an empty or error state below the apps filter bar, in place of the app lists.
 */
const AppsPageEmptyState = ({ offset, children }: AppsPageEmptyStateProps) => <Box marginBlockStart={offset}>{children}</Box>;

export default AppsPageEmptyState;
