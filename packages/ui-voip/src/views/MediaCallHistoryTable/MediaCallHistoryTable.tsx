import { GenericTable, GenericTableHeaderCell, GenericTableHeader, GenericTableBody, GenericTableCell } from '@rocket.chat/ui-client';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

type SortBy = 'contact' | 'type' | 'status' | 'timestamp';

type SortProps = {
	sortBy: SortBy;
	sortDirection: 'asc' | 'desc';
	setSort: (sortBy: SortBy, direction?: 'asc' | 'desc') => void;
};

type MediaCallHistoryTableProps = {
	sort: SortProps;
	children: ReactNode;
};

const MediaCallHistoryTable = ({ sort, children }: MediaCallHistoryTableProps) => {
	const { t } = useTranslation();
	const { sortBy, sortDirection, setSort: onClickSort } = sort;

	return (
		<GenericTable>
			<GenericTableHeader>
				<GenericTableHeaderCell key='contact' sort='contact' onClick={onClickSort} active={sortBy === 'contact'} direction={sortDirection}>
					{t('Contact')}
				</GenericTableHeaderCell>
				<GenericTableHeaderCell key='type' sort='type' onClick={onClickSort} active={sortBy === 'type'} direction={sortDirection}>
					{t('Type')}
				</GenericTableHeaderCell>
				<GenericTableHeaderCell key='status' sort='status' onClick={onClickSort} active={sortBy === 'status'} direction={sortDirection}>
					{t('Status')}
				</GenericTableHeaderCell>
				<GenericTableHeaderCell
					key='timestamp'
					sort='timestamp'
					onClick={onClickSort}
					active={sortBy === 'timestamp'}
					direction={sortDirection}
				>
					{t('Time_slash_Date')}
				</GenericTableHeaderCell>
				{/* This cell has to be `td` because of a11y guidelines (Table header cells cannot be empty) */}
				<GenericTableCell key='menu' width={44} aria-label={t('Options')} is='td' />
			</GenericTableHeader>
			<GenericTableBody>{children}</GenericTableBody>
		</GenericTable>
	);
};

export default MediaCallHistoryTable;
