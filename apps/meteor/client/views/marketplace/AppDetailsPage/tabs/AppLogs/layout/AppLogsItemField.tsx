import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type AppsLogItemFieldProps = {
	label: string;
	field: ReactNode;
	first?: boolean;
};

/**
 * One detail of an expanded log entry, its label in bold over its value; `first` drops the space above it.
 */
export const AppsLogItemField = ({ label, field, first = false }: AppsLogItemFieldProps) => (
	<Box marginBlock='x16' marginBlockStart={first ? 'none' : undefined} display='flex' flexDirection='column'>
		<Box fontWeight={700}>{label}</Box>
		{field}
	</Box>
);
