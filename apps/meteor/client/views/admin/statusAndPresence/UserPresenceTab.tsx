import { Button, Pagination, type TableColumnWidth } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import {
	GenericTable,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableBody,
	GenericTableLoadingTable,
	usePagination,
	GenericNoResults,
} from '@rocket.chat/ui-client';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import UserPresenceTabRow from './UserPresenceTabRow';
import type { ManagedPresenceUser } from './useManagedPresenceUsers';
import { useManagedPresenceUsers } from './useManagedPresenceUsers';
import FilterByText from '../../../components/FilterByText';
import GenericError from '../../../components/GenericError';
import { managedPresenceQueryKeys } from '../../../lib/queryKeys';

export type UserPresenceTabProps = {
	onEdit: (user?: ManagedPresenceUser) => void;
};

const UserPresenceTab = ({ onEdit }: UserPresenceTabProps) => {
	const { t } = useTranslation();
	const [text, setText] = useState('');

	const query = useDebouncedValue(
		useMemo(() => ({ searchTerm: text }), [text]),
		500,
	);

	const {
		paginatedQuery,
		queryKey,
		current,
		itemsPerPage,
		setItemsPerPage: onSetItemsPerPage,
		setCurrent: onSetCurrent,
		...paginationProps
	} = usePagination({ query, getQueryKey: (query) => managedPresenceQueryKeys.list(query) });

	useEffect(() => {
		onSetCurrent(0);
	}, [text, onSetCurrent]);

	const { data, isLoading, isSuccess, isError, refetch } = useManagedPresenceUsers(paginatedQuery);

	const columns: TableColumnWidth[] = ['auto', 'auto', 'auto', 'x48'];

	const headers = (
		<>
			<GenericTableHeaderCell key='name'>{t('Name')}</GenericTableHeaderCell>
			<GenericTableHeaderCell key='presence'>{t('Status')}</GenericTableHeaderCell>
			<GenericTableHeaderCell key='hiddenFrom'>{t('Hidden_from')}</GenericTableHeaderCell>
			<GenericTableHeaderCell key='actions' />
		</>
	);

	return (
		<>
			<FilterByText placeholder={t('Search_Users')} value={text} onChange={(event) => setText(event.target.value)}>
				<Button onClick={() => onEdit()}>{t('Manage_user_status')}</Button>
			</FilterByText>
			{isError && <GenericError icon='circle-exclamation' buttonAction={() => refetch()} />}
			{isSuccess && data.users.length === 0 && (
				<GenericNoResults icon='user' title={t('No_user_status_settings')} description={t('No_user_status_settings_description')} />
			)}
			{(isLoading || (isSuccess && data.users.length > 0)) && (
				<>
					<GenericTable columns={columns}>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>
							{isLoading && <GenericTableLoadingTable headerCells={4} />}
							{isSuccess && data.users.map((user) => <UserPresenceTabRow key={user._id} user={user} onClick={onEdit} />)}
						</GenericTableBody>
					</GenericTable>
					{isSuccess && (
						<Pagination
							divider
							current={current}
							itemsPerPage={itemsPerPage}
							onSetItemsPerPage={onSetItemsPerPage}
							onSetCurrent={onSetCurrent}
							{...paginationProps}
						/>
					)}
				</>
			)}
		</>
	);
};

export default UserPresenceTab;
