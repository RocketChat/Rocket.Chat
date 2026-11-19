import type { ContactsSortableField } from '@rocket.chat/rest-typings';
import { GenericTable, GenericTableBody, GenericTableCell, GenericTableHeader, GenericTableHeaderCell } from '@rocket.chat/ui-client';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import ContactsColumnsMenu from './ContactsColumnsMenu';
import type { ContactsColumns } from './hooks/useContactsColumns';
import { CONTACT_COLUMNS } from './hooks/useContactsColumns';

type SortProps = {
	sortBy: ContactsSortableField;
	sortDirection: 'asc' | 'desc';
	setSort: (sortBy: ContactsSortableField, direction?: 'asc' | 'desc') => void;
};

export type ContactsTableProps = {
	sort: SortProps;
	sortableByFavorite: boolean;
	columns: ContactsColumns;
	children: ReactNode;
};

const ContactsTable = ({ sort, sortableByFavorite, columns, children }: ContactsTableProps) => {
	const { t } = useTranslation();
	const { sortBy, sortDirection, setSort: onClickSort } = sort;
	const visibleColumns = CONTACT_COLUMNS.filter(({ key }) => columns.isVisible(key));

	const sortByFavorite = () => onClickSort('favorite', sortBy === 'favorite' && sortDirection === 'desc' ? 'asc' : 'desc');

	return (
		<GenericTable columns={['x44', ...visibleColumns.map(() => 'auto' as const), 'x44']}>
			<GenericTableHeader>
				{sortableByFavorite ? (
					<GenericTableHeaderCell
						key='favorite'
						sort='favorite'
						onClick={sortByFavorite}
						active={sortBy === 'favorite'}
						direction={sortDirection}
						title={t('Favorite')}
					/>
				) : (
					<GenericTableCell key='favorite' />
				)}
				{visibleColumns.map(({ key, label }) => (
					<GenericTableHeaderCell key={key} sort={key} onClick={onClickSort} active={sortBy === key} direction={sortDirection}>
						{t(label)}
					</GenericTableHeaderCell>
				))}
				<GenericTableCell key='menu'>
					<ContactsColumnsMenu columns={columns} />
				</GenericTableCell>
			</GenericTableHeader>
			<GenericTableBody>{children}</GenericTableBody>
		</GenericTable>
	);
};

export default ContactsTable;
