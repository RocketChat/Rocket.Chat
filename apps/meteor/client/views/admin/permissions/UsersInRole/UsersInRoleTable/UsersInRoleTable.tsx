import type { IUserInRole, Serialized } from '@rocket.chat/core-typings';
import { Pagination } from '@rocket.chat/fuselage';
import {
	GenericTable,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableBody,
	GenericTableLoadingTable,
} from '@rocket.chat/ui-client';
import type { usePagination } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import UsersInRoleTableRow from './UsersInRoleTableRow';
import GenericError from '../../../../../components/GenericError';
import GenericNoResults from '../../../../../components/GenericNoResults';

type UsersInRoleTableProps = {
	isLoading: boolean;
	isError: boolean;
	isSuccess: boolean;
	total: number;
	users: Serialized<IUserInRole>[];
	onRemove: (username: IUserInRole['username']) => void;
	paginationData: ReturnType<typeof usePagination>;
	refetch: () => void;
};

const UsersInRoleTable = ({ isLoading, isSuccess, isError, total, users, onRemove, refetch, paginationData }: UsersInRoleTableProps) => {
	const { t } = useTranslation();
	const { current, itemsPerPage, setCurrent, setItemsPerPage, ...paginationProps } = paginationData;

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
						current={current}
						itemsPerPage={itemsPerPage}
						count={total}
						onSetItemsPerPage={setItemsPerPage}
						onSetCurrent={setCurrent}
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
