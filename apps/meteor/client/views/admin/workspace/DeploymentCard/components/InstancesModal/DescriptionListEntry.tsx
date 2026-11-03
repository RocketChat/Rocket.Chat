import { TableCell, TableRow, Text } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';
import { memo } from 'react';

export type DescriptionListEntryProps = {
	label: ReactNode;
	children: ReactNode;
};

const DescriptionListEntry = ({ children, label }: DescriptionListEntryProps) => (
	<TableRow>
		<TableCell rowHeader align='end'>
			{label}
		</TableCell>
		<TableCell align='start'>
			<Text color='default'>{children}</Text>
		</TableCell>
	</TableRow>
);

export default memo(DescriptionListEntry);
