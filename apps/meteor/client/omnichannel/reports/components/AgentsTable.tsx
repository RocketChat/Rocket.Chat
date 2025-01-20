import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import {
	GenericTable,
	GenericTableBody,
	GenericTableCell,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableRow,
} from '../../../components/GenericTable';

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
	const { t } = useTranslation();

	const onHeaderClick = useEffectEvent((id: 'name' | 'total') => {
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
						<GenericTableCell withTruncatedText>{item.label}</GenericTableCell>
						<GenericTableCell>{item.value}</GenericTableCell>
					</GenericTableRow>
				))}
			</GenericTableBody>
		</GenericTable>
	);
});

AgentsTable.displayName = 'AgentsTable';
