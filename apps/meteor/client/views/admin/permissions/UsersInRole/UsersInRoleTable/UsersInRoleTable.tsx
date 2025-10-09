import type { IUserInRole, Serialized } from '@rocket.chat/core-typings';
import { Pagination } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import UsersInRoleTableRow from './UsersInRoleTableRow';
import GenericError from '../../../../../components/GenericError';
import GenericNoResults from '../../../../../components/GenericNoResults';
import {
	GenericTable,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableBody,
	GenericTableLoadingTable,
} from '../../../../../components/GenericTable';
import type { usePagination } from '../../../../../components/GenericTable/hooks/usePagination';

type UsersInRoleTableProps = {
	isLoading: boolean;
	isError: boolean;
	isSuccess: boolean;
	total: number;
	users: Serialized<IUserInRole>[];
	onRemove: (username: IUserInRole['username']) => void;
	paginationProps?: ReturnType<typeof usePagination>;
	refetch: () => void;
};

const UsersInRoleTable = ({ isLoading, isSuccess, isError, total, users, onRemove, refetch, paginationProps }: UsersInRoleTableProps) => {
	const { t } = useTranslation();

	const headers = (
		<>
			<GenericTableHeaderCell>{t('Name')}</GenericTableHeaderCell>
			<GenericTableHeaderCell>{t('Email')}</GenericTableHeaderCell>
			<GenericTableHeaderCell w='x80'>{t('Actions')}</GenericTableHeaderCell>
		</>
	);

	return (
		<>
			{isLoading && (
				<GenericTable>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>
						<GenericTableLoadingTable headerCells={3} />
					</GenericTableBody>
				</GenericTable>
			)}
			{isSuccess && users?.length > 0 && (
				<>
					<GenericTable>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>
							{users.map((user) => (
								<UsersInRoleTableRow key={user?._id} user={user} onRemove={onRemove} />
							))}
						</GenericTableBody>
					</GenericTable>
					<Pagination
						divider
						count={total}
						onSetItemsPerPage={paginationProps?.setItemsPerPage}
						onSetCurrent={paginationProps?.setCurrent}
						{...paginationProps}
					/>
				</>
			)}
			{isSuccess && users?.length === 0 && <GenericNoResults />}
			{isError && <GenericError buttonAction={refetch} />}
		</>
	);
};

export default UsersInRoleTable;
