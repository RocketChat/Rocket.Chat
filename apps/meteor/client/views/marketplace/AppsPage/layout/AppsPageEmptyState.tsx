import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type AppsPageEmptyStateProps = {
	children: ReactNode;
};

/**
 * Places an empty or error state below the apps filter bar, in place of the app lists.
 */
const AppsPageEmptyState = ({ children }: AppsPageEmptyStateProps) => <Box marginBlockStart='x24'>{children}</Box>;

export default AppsPageEmptyState;
