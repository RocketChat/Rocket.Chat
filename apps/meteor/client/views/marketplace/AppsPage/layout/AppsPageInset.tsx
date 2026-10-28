import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type AppsPageInsetProps = {
	children: ReactNode;
};

/**
 * A block of the apps page inset to line up with the page header.
 */
const AppsPageInset = ({ children }: AppsPageInsetProps) => <Box paddingInline='x24'>{children}</Box>;

export default AppsPageInset;
