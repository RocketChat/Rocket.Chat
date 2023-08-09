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
import { useSort } from '../../../../../client/components/GenericTable/hooks/useSort';

type AgentsTableProps = {
	data: {
		label: string;
		value: number;
	}[];
};

export const AgentsTable = memo(({ data }: AgentsTableProps) => {
	const t = useTranslation();
	const { sortBy, sortDirection, setSort } = useSort<'name' | 'total'>('name');

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
