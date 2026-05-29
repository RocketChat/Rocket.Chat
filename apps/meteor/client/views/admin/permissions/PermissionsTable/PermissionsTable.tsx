import type { IPermission, IRole } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Pagination, Palette } from '@rocket.chat/fuselage';
import { GenericTable, GenericTableHeader, GenericTableHeaderCell, GenericTableBody } from '@rocket.chat/ui-client';
import type { usePagination } from '@rocket.chat/ui-client';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import PermissionRow from './PermissionRow';
import PermissionsTableFilter from './PermissionsTableFilter';
import RoleHeader from './RoleHeader';
import GenericNoResults from '../../../../components/GenericNoResults';

type PermissionsTableProps = {
	roleList: IRole[];
	permissions: IPermission[];
	setFilter: (filter: string) => void;
	total: number;
	paginationData: ReturnType<typeof usePagination>;
};

const PermissionsTable = ({ roleList, permissions, setFilter, total, paginationData }: PermissionsTableProps) => {
	const { t } = useTranslation();

	const addPermissionRole = useEndpoint('POST', '/v1/permissions.addRole');
	const removePermissionRole = useEndpoint('POST', '/v1/permissions.removeRole');

	const grantRole = useCallback(
		async (permissionId: IPermission['_id'], role: IRole['_id']) => {
			await addPermissionRole({ permissionId, role });
		},
		[addPermissionRole],
	);

	const removeRole = useCallback(
		async (permissionId: IPermission['_id'], role: IRole['_id']) => {
			await removePermissionRole({ permissionId, role });
		},
		[removePermissionRole],
	);

	const { current, itemsPerPage, setCurrent, setItemsPerPage, ...paginationProps } = paginationData;

	const tableCustomStyle = css`
		// Makes the first column of the table sticky
		tr > th {
			&:first-child {
				position: sticky;
				left: 0;
				background-color: ${Palette.surface['surface-light']};
				z-index: 12;
			}
		}
		tr > td {
			&:first-child {
				position: sticky;
				left: 0;
				box-shadow: -1px 0 0 ${Palette.stroke['stroke-light']} inset;
				background-color: ${Palette.surface['surface-light']};
				z-index: 11;
			}
		}

		tr:hover {
			td {
				&:first-child {
					background-color: ${Palette.surface['surface-hover']};
				}
			}
			td > :nth-child(2) {
				visibility: visible;
				opacity: 1;
			}
		}
	`;

	return (
		<>
			<PermissionsTableFilter onChange={setFilter} />
			{permissions?.length === 0 && <GenericNoResults />}
			{permissions?.length > 0 && (
				<>
					<GenericTable className={[tableCustomStyle]} fixed={false}>
						<GenericTableHeader>
							<GenericTableHeaderCell width='x120'>{t('Name')}</GenericTableHeaderCell>
							{roleList?.map(({ _id, name, description }) => <RoleHeader key={_id} _id={_id} name={name} description={description} />)}
						</GenericTableHeader>
						<GenericTableBody>
							{permissions.map((permission) => (
								<PermissionRow key={permission._id} permission={permission} roleList={roleList} onGrant={grantRole} onRemove={removeRole} />
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
		</>
	);
};

export default PermissionsTable;
