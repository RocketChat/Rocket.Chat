import type { IUserInRole, Serialized } from '@rocket.chat/core-typings';
import { Pagination, type TableColumnWidth } from '@rocket.chat/fuselage';
import type { PaginationProps } from '@rocket.chat/ui-client';
import {
	GenericTable,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableBody,
	GenericTableLoadingTable,
	GenericNoResults,
} from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import UsersInRoleTableRow from './UsersInRoleTableRow';
import GenericError from '../../../../../components/GenericError';

export type UsersInRoleTableProps = {
	isLoading: boolean;
	isError: boolean;
	isSuccess: boolean;
	users: Serialized<IUserInRole>[];
	onRemove: (username: IUserInRole['username']) => void;
	paginationProps: PaginationProps;
	refetch: () => void;
};

const UsersInRoleTable = ({ isLoading, isSuccess, isError, users, onRemove, refetch, paginationProps }: UsersInRoleTableProps) => {
	const { t } = useTranslation();

	const columns: TableColumnWidth[] = ['auto', 'auto', 'x80'];

	const headers = (
		<>
			<GenericTableHeaderCell>{t('Name')}</GenericTableHeaderCell>
			<GenericTableHeaderCell>{t('Email')}</GenericTableHeaderCell>
			<GenericTableHeaderCell>{t('Actions')}</GenericTableHeaderCell>
		</>
	);

	return (
		<>
			{isLoading && (
				<GenericTable columns={columns}>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>
						<GenericTableLoadingTable headerCells={3} />
					</GenericTableBody>
				</GenericTable>
			)}
			{isSuccess && users?.length > 0 && (
				<>
					<GenericTable columns={columns}>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>
							{users.map((user) => (
								<UsersInRoleTableRow key={user?._id} user={user} onRemove={onRemove} />
							))}
						</GenericTableBody>
					</GenericTable>
					<Pagination divider {...paginationProps} />
				</>
			)}
			{isSuccess && users?.length === 0 && <GenericNoResults />}
			{isError && <GenericError buttonAction={refetch} />}
		</>
	);
};

export default UsersInRoleTable;
