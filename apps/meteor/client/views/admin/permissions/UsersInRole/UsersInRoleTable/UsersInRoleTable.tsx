import type { IRole, IRoom, IUserInRole } from '@rocket.chat/core-typings';
import { Pagination } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import UsersInRoleTableRow from './UsersInRoleTableRow';
import GenericError from '../../../../../components/GenericError';
import GenericModal from '../../../../../components/GenericModal';
import GenericNoResults from '../../../../../components/GenericNoResults';
import {
	GenericTable,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableBody,
	GenericTableLoadingTable,
} from '../../../../../components/GenericTable';
import { usePagination } from '../../../../../components/GenericTable/hooks/usePagination';

type UsersInRoleTableProps = {
	roleName: IRole['name'];
	roleId: IRole['_id'];
	description: IRole['description'];
	rid?: IRoom['_id'];
};

const UsersInRoleTable = ({ rid, roleId, roleName, description }: UsersInRoleTableProps): ReactElement => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const queryClient = useQueryClient();

	const getUsersInRoleEndpoint = useEndpoint('GET', '/v1/roles.getUsersInRole');
	const removeUserFromRoleEndpoint = useEndpoint('POST', '/v1/roles.removeUserFromRole');

	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();

	const query = useMemo(
		() => ({
			role: roleId,
			...(rid && { roomId: rid }),
			...(itemsPerPage && { count: itemsPerPage }),
			...(current && { offset: current }),
		}),
		[itemsPerPage, current, rid, roleId],
	);

	const { data, isLoading, isSuccess, refetch, isError } = useQuery({
		queryKey: ['getUsersInRole', roleId, query],

		queryFn: async () => getUsersInRoleEndpoint(query),
	});

	const users =
		data?.users?.map((user) => ({
			...user,
			createdAt: new Date(user.createdAt),
			_updatedAt: new Date(user._updatedAt),
		})) || [];

	const handleRemove = useEffectEvent((username: IUserInRole['username']) => {
		const remove = async () => {
			try {
				if (!username) throw new Error('Username is required');

				await removeUserFromRoleEndpoint({ roleId, username, scope: rid });
				dispatchToastMessage({ type: 'success', message: t('User_removed') });
				queryClient.invalidateQueries({
					queryKey: ['getUsersInRole'],
				});
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				setModal(null);
			}
		};

		setModal(
			<GenericModal variant='danger' onConfirm={remove} onCancel={() => setModal(null)} confirmText={t('Delete')}>
				{t('The_user_s_will_be_removed_from_role_s', { postProcess: 'sprintf', sprintf: [username, description || roleName] })}
			</GenericModal>,
		);
	});

	const headers = (
		<>
			<GenericTableHeaderCell>{t('Name')}</GenericTableHeaderCell>
			<GenericTableHeaderCell>{t('Email')}</GenericTableHeaderCell>
			<GenericTableHeaderCell w='x80'></GenericTableHeaderCell>
		</>
	);

	return (
		<>
			{isLoading && (
				<GenericTable>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>
						<GenericTableLoadingTable headerCells={2} />
					</GenericTableBody>
				</GenericTable>
			)}
			{isSuccess && users?.length > 0 && (
				<>
					<GenericTable>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>
							{users?.map((user) => <UsersInRoleTableRow onRemove={handleRemove} key={user?._id} user={user} />)}
						</GenericTableBody>
					</GenericTable>
					<Pagination
						divider
						current={current}
						itemsPerPage={itemsPerPage}
						count={users.length || 0}
						onSetItemsPerPage={onSetItemsPerPage}
						onSetCurrent={onSetCurrent}
						{...paginationProps}
					/>
				</>
			)}
			{users?.length === 0 && <GenericNoResults />}
			{isError && <GenericError buttonAction={refetch} />}
		</>
	);
};

export default UsersInRoleTable;
