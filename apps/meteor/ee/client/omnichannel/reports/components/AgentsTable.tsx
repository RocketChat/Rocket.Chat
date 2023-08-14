import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { memo } from 'react';

import {
	GenericTable,
	GenericTableBody,
	GenericTableCell,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableRow,
} from '../../../../../client/components/GenericTable';

type AgentsTableProps = {
	data: {
		label: string;
		value: number;
	}[];
	sortBy: string;
	sortDirection: 'asc' | 'desc';
	setSort: (sortBy: 'name' | 'total', sortDirection: 'asc' | 'desc') => void;
};

export const AgentsTable = memo(({ data, sortBy, sortDirection, setSort }: AgentsTableProps) => {
	const t = useTranslation();

	const onHeaderClick = useMutableCallback((id) => {
		setSort(id, sortDirection === 'asc' ? 'desc' : 'asc');
	});

	return (
		<GenericTable>
			<GenericTableHeader>
				<GenericTableHeaderCell sort='name' direction={sortDirection} active={sortBy === 'name'} onClick={onHeaderClick}>
					{t('Agents')}
				</GenericTableHeaderCell>
				<GenericTableHeaderCell sort='total' direction={sortDirection} active={sortBy === 'total'} onClick={onHeaderClick}>
					{t('Total_conversations')}
				</GenericTableHeaderCell>
			</GenericTableHeader>
			<GenericTableBody>
				{data.map((item) => (
					<GenericTableRow key={`${item.label}_${item.value}`}>
						<GenericTableCell>{item.label}</GenericTableCell>
						<GenericTableCell>{item.value}</GenericTableCell>
					</GenericTableRow>
				))}
			</GenericTableBody>
		</GenericTable>
	);
});

AgentsTable.displayName = 'AgentsTable';
