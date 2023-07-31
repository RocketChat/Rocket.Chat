import { Skeleton, TableRow, TableCell } from '@rocket.chat/fuselage';
import React from 'react';

function ImportOperationSummarySkeleton({ small }) {
	return (
		<TableRow>
			<TableCell>
				<Skeleton />
			</TableCell>
			<TableCell>
				<Skeleton />
			</TableCell>
			{!small && (
				<>
					<TableCell>
						<Skeleton />
					</TableCell>
					<TableCell>
						<Skeleton />
					</TableCell>
					<TableCell>
						<Skeleton />
					</TableCell>
					<TableCell>
						<Skeleton />
					</TableCell>
					<TableCell>
						<Skeleton />
					</TableCell>
					<TableCell>
						<Skeleton />
					</TableCell>
				</>
			)}
		</TableRow>
	);
}

export default ImportOperationSummarySkeleton;
