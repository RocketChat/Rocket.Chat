import { GenericTableLoadingRow } from './GenericTableLoadingRow.js';

export type GenericTableLoadingTableProps = { headerCells: number };

export const GenericTableLoadingTable = ({ headerCells }: GenericTableLoadingTableProps) => (
	<>
		{Array.from({ length: 10 }, (_, i) => (
			<GenericTableLoadingRow key={i} cols={headerCells} />
		))}
	</>
);
