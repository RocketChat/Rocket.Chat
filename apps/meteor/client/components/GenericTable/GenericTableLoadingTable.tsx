import type { ReactElement } from 'react';
import React from 'react';

import { GenericTableLoadingRow } from './GenericTableLoadingRow';

export const GenericTableLoadingTable = ({ headerCells }: { headerCells: number }): ReactElement => (
	<>
		{Array.from({ length: 10 }, (_, i) => (
			<GenericTableLoadingRow key={i} cols={headerCells} />
		))}
	</>
);
