import { Box, Skeleton, TableRow, TableCell } from '@rocket.chat/fuselage';

export type GenericTableLoadingRowProps = { cols: number };

export const GenericTableLoadingRow = ({ cols }: GenericTableLoadingRowProps) => (
	<TableRow>
		<TableCell>
			<Box display='flex'>
				<Skeleton variant='rect' height={40} width={40} />
				<Box marginInline={8} flexGrow={1}>
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
