import type { IUserInRole, Serialized } from '@rocket.chat/core-typings';
import { Pagination } from '@rocket.chat/fuselage';
import {
	GenericTable,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableBody,
	GenericTableLoadingTable,
} from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';

import UsersInRoleTableRow from './UsersInRoleTableRow';
import GenericError from '../../../../../components/GenericError';
import GenericNoResults from '../../../../../components/GenericNoResults';

export type UsersInRoleTableProps = {
	isLoading: boolean;
	isError: boolean;
	isSuccess: boolean;
	users: Serialized<IUserInRole>[];
	onRemove: (username: IUserInRole['username']) => void;
	paginationProps: ComponentProps<typeof Pagination>;
	refetch: () => void;
};

const UsersInRoleTable = ({ isLoading, isSuccess, isError, users, onRemove, refetch, paginationProps }: UsersInRoleTableProps) => {
	const { t } = useTranslation();

	const headers = (
		<>
			<GenericTableHeaderCell>{t('Name')}</GenericTableHeaderCell>
			<GenericTableHeaderCell>{t('Email')}</GenericTableHeaderCell>
			<GenericTableHeaderCell width='x80'>{t('Actions')}</GenericTableHeaderCell>
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
					<Pagination divider {...paginationProps} />
				</>
			)}
			{isSuccess && users?.length === 0 && <GenericNoResults />}
			{isError && <GenericError buttonAction={refetch} />}
		</>
	);
};

export default UsersInRoleTable;
