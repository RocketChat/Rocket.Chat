import { Button, Pagination } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import {
	GenericTable,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableBody,
	GenericTableLoadingTable,
	usePagination,
} from '@rocket.chat/ui-client';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import UserPresenceTabRow from './UserPresenceTabRow';
import type { ManagedPresenceUser } from './useManagedPresenceUsers';
import { useManagedPresenceUsers } from './useManagedPresenceUsers';
import FilterByText from '../../../components/FilterByText';
import GenericError from '../../../components/GenericError';
import GenericNoResults from '../../../components/GenericNoResults';

export type UserPresenceTabProps = {
	onEdit: (user?: ManagedPresenceUser) => void;
};

const UserPresenceTab = ({ onEdit }: UserPresenceTabProps) => {
	const { t } = useTranslation();
	const [text, setText] = useState('');
	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();

	const query = useDebouncedValue(
		useMemo(() => ({ searchTerm: text, count: itemsPerPage, offset: current }), [text, itemsPerPage, current]),
		500,
	);

	useEffect(() => {
		onSetCurrent(0);
	}, [text, onSetCurrent]);

	const { data, isLoading, isSuccess, isError, refetch } = useManagedPresenceUsers(query);

	const headers = (
		<>
			<GenericTableHeaderCell key='name'>{t('Name')}</GenericTableHeaderCell>
			<GenericTableHeaderCell key='presence'>{t('Status')}</GenericTableHeaderCell>
			<GenericTableHeaderCell key='hiddenFrom'>{t('Hidden_from')}</GenericTableHeaderCell>
		</>
	);

	return (
		<>
			<FilterByText placeholder={t('Search_Users')} value={text} onChange={(event) => setText(event.target.value)}>
				<Button onClick={() => onEdit()}>{t('Manage_user_presence')}</Button>
			</FilterByText>
			{isError && <GenericError icon='circle-exclamation' buttonAction={() => refetch()} />}
			{isSuccess && data.users.length === 0 && (
				<GenericNoResults title={t('No_managed_users')} description={t('No_managed_users_description')} />
			)}
			{(isLoading || (isSuccess && data.users.length > 0)) && (
				<>
					<GenericTable>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>
							{isLoading && <GenericTableLoadingTable headerCells={3} />}
							{isSuccess && data.users.map((user) => <UserPresenceTabRow key={user._id} user={user} onClick={onEdit} />)}
						</GenericTableBody>
					</GenericTable>
					{isSuccess && (
						<Pagination
							divider
							current={current}
							itemsPerPage={itemsPerPage}
							count={data.total}
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
