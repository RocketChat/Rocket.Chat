import { Skeleton, TableRow, TableCell } from '@rocket.chat/fuselage';

type ImportOperationSummarySkeletonProps = {
	small?: boolean;
};

function ImportOperationSummarySkeleton({ small = false }: ImportOperationSummarySkeletonProps) {
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
					<TableCell>
						<Skeleton />
					</TableCell>
				</>
			)}
		</TableRow>
	);
}

export default ImportOperationSummarySkeleton;
