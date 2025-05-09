import { Box, Skeleton, TableRow, TableCell } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';

export const GenericTableLoadingRow = ({ cols }: { cols: number }): ReactElement => (
	<TableRow>
		<TableCell>
			<Box display='flex'>
				<Skeleton variant='rect' height={40} width={40} />
				<Box mi={8} flexGrow={1}>
					<Skeleton width='100%' />
					<Skeleton width='100%' />
				</Box>
			</Box>
		</TableCell>
		{Array.from({ length: cols - 1 }, (_, i) => (
			<TableCell key={i}>
				<Skeleton width='100%' />
			</TableCell>
		))}
	</TableRow>
);
