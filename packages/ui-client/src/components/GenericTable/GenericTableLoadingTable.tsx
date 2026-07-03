import { GenericTableLoadingRow } from './GenericTableLoadingRow';

export const GenericTableLoadingTable = ({ headerCells }: { headerCells: number }) => (
	<>
		{Array.from({ length: 10 }, (_, i) => (
			<GenericTableLoadingRow key={i} cols={headerCells} />
		))}
	</>
);
