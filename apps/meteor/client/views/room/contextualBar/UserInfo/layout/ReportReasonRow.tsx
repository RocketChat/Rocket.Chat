import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type ReportReasonRowProps = {
	children: ReactNode;
};

/**
 * The row holding the report's reason, kept 4px clear of the error below it.
 */
const ReportReasonRow = ({ children }: ReportReasonRowProps) => <Box paddingBlockEnd='x4'>{children}</Box>;

export default ReportReasonRow;
