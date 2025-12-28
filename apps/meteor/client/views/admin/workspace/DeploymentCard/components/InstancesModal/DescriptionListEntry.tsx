import { TableRow, TableCell } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';
import { memo } from 'react';

type DescriptionListEntryProps = {
	label: ReactNode;
	children: ReactNode;
};

const DescriptionListEntry = ({ children, label }: DescriptionListEntryProps) => (
	<TableRow>
		<TableCell wordBreak='break-word' is='th' scope='col' align='end' color='hint' backgroundColor='surface' fontScale='p2m'>
			{label}
		</TableCell>
		<TableCell align='start' color='default'>
			{children}
		</TableCell>
	</TableRow>
);

export default memo(DescriptionListEntry);
