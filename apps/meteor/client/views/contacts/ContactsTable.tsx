import { CheckBox } from '@rocket.chat/fuselage';
import {
	GenericMenu,
	GenericTable,
	GenericTableBody,
	GenericTableCell,
	GenericTableHeader,
	GenericTableHeaderCell,
} from '@rocket.chat/ui-client';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import type { ContactsColumnKey, ContactsColumns } from './hooks/useContactsColumns';
import { CONTACT_COLUMNS } from './hooks/useContactsColumns';

type SortProps = {
	sortBy: ContactsColumnKey;
	sortDirection: 'asc' | 'desc';
	setSort: (sortBy: ContactsColumnKey, direction?: 'asc' | 'desc') => void;
};

export type ContactsTableProps = {
	sort: SortProps;
	columns: ContactsColumns;
	children: ReactNode;
};

const ContactsTable = ({ sort, columns, children }: ContactsTableProps) => {
	const { t } = useTranslation();
	const { sortBy, sortDirection, setSort: onClickSort } = sort;

	return (
		<GenericTable>
			<GenericTableHeader>
				{CONTACT_COLUMNS.filter(({ key }) => columns.isVisible(key)).map(({ key, label }) => (
					<GenericTableHeaderCell key={key} sort={key} onClick={onClickSort} active={sortBy === key} direction={sortDirection}>
						{t(label)}
					</GenericTableHeaderCell>
				))}
				<GenericTableCell key='menu' width={44} is='td'>
					<GenericMenu
						title={t('Show_columns')}
						icon='kebab'
						selectionMode='multiple'
						selectedKeys={CONTACT_COLUMNS.filter(({ key }) => columns.isVisible(key)).map(({ key }) => key)}
						sections={[
							{
								title: t('Show_columns'),
								items: CONTACT_COLUMNS.map(({ key, label }) => ({
									id: key,
									content: t(label),
									disabled: columns.isDisabled(key),
									addon: (
										<CheckBox
											checked={columns.isVisible(key)}
											disabled={columns.isDisabled(key)}
											onChange={() => undefined}
											tabIndex={-1}
											aria-hidden='true'
										/>
									),
									onClick: () => columns.toggle(key),
								})),
							},
						]}
					/>
				</GenericTableCell>
			</GenericTableHeader>
			<GenericTableBody>{children}</GenericTableBody>
		</GenericTable>
	);
};

export default ContactsTable;
