import { Box, Skeleton, Table } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';

type GenericTableLoadingRowRowProps = {
	cols: number;
};

export const GenericTableLoadingRow = ({ cols }: GenericTableLoadingRowRowProps): ReactElement => (
	<Table.Row>
		<Table.Cell>
			<Box display='flex'>
				<Skeleton variant='rect' height={40} width={40} />
				<Box mi='x8' flexGrow={1}>
					<Skeleton width='100%' />
					<Skeleton width='100%' />
				</Box>
			</Box>
		</Table.Cell>
		{Array.from({ length: cols - 1 }, (_, i) => (
			<Table.Cell key={i}>
				<Skeleton width='100%' />
			</Table.Cell>
		))}
	</Table.Row>
);
