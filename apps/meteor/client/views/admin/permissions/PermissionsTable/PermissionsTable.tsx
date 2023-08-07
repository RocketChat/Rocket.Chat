import { Margins, Tabs, Button, Pagination } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useRoute, usePermission, useMethod, useTranslation, useSetModal } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useState } from 'react';

import GenericNoResults from '../../../../components/GenericNoResults';
import { GenericTable, GenericTableHeader, GenericTableHeaderCell, GenericTableBody } from '../../../../components/GenericTable';
import { usePagination } from '../../../../components/GenericTable/hooks/usePagination';
import Page from '../../../../components/Page';
import CustomRoleUpsellModal from '../CustomRoleUpsellModal';
import PermissionsContextBar from '../PermissionsContextBar';
import { usePermissionsAndRoles } from '../hooks/usePermissionsAndRoles';
import PermissionRow from './PermissionRow';
import PermissionsTableFilter from './PermissionsTableFilter';
import RoleHeader from './RoleHeader';

const PermissionsTable = ({ isEnterprise }: { isEnterprise: boolean }): ReactElement => {
	const t = useTranslation();
	const [filter, setFilter] = useState('');
	const canViewPermission = usePermission('access-permissions');
	const canViewSettingPermission = usePermission('access-setting-permissions');
	const defaultType = canViewPermission ? 'permissions' : 'settings';
	const [type, setType] = useState(defaultType);
	const router = useRoute('admin-permissions');
	const setModal = useSetModal();

	const grantRole = useMethod('authorization:addPermissionToRole');
	const removeRole = useMethod('authorization:removeRoleFromPermission');

	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();
	const { permissions, total, roleList } = usePermissionsAndRoles(type, filter, itemsPerPage, current);

	const handlePermissionsTab = useMutableCallback(() => {
		if (type === 'permissions') {
			return;
		}
		setType('permissions');
	});

	const handleSettingsTab = useMutableCallback(() => {
		if (type === 'settings') {
			return;
		}
		setType('settings');
	});

	const handleAdd = useMutableCallback(() => {
		if (!isEnterprise) {
			setModal(<CustomRoleUpsellModal onClose={() => setModal(null)} />);
			return;
		}
		router.push({
			context: 'new',
		});
	});

	return (
		<Page flexDirection='row'>
			<Page>
				<Page.Header title={t('Permissions')}>
					<Button primary onClick={handleAdd} aria-label={t('New')} name={t('New_role')}>
						{t('New_role')}
					</Button>
				</Page.Header>
				<Margins blockEnd={16}>
					<Tabs>
						<Tabs.Item
							data-qa='PermissionTable-Permissions'
							selected={type === 'permissions'}
							onClick={handlePermissionsTab}
							disabled={!canViewPermission}
						>
							{t('Permissions')}
						</Tabs.Item>
						<Tabs.Item
							data-qa='PermissionTable-Settings'
							selected={type === 'settings'}
							onClick={handleSettingsTab}
							disabled={!canViewSettingPermission}
						>
							{t('Settings')}
						</Tabs.Item>
					</Tabs>
				</Margins>
				<Page.Content mb='neg-x8'>
					<Margins block={8}>
						<PermissionsTableFilter onChange={setFilter} />
						{permissions?.length === 0 && <GenericNoResults />}
						{permissions?.length > 0 && (
							<>
								<GenericTable fixed={false}>
									<GenericTableHeader>
										<GenericTableHeaderCell width='x120'>{t('Name')}</GenericTableHeaderCell>
										{roleList?.map(({ _id, name, description }) => (
											<RoleHeader key={_id} _id={_id} name={name} description={description} />
										))}
									</GenericTableHeader>
									<GenericTableBody>
										{permissions?.map((permission) => (
											<PermissionRow
												key={permission._id}
												permission={permission}
												roleList={roleList}
												onGrant={grantRole}
												onRemove={removeRole}
											/>
										))}
									</GenericTableBody>
								</GenericTable>
								<Pagination
									divider
									current={current}
									itemsPerPage={itemsPerPage}
									count={total}
									onSetItemsPerPage={onSetItemsPerPage}
									onSetCurrent={onSetCurrent}
									{...paginationProps}
								/>
							</>
						)}
					</Margins>
				</Page.Content>
			</Page>
			<PermissionsContextBar />
		</Page>
	);
};

export default PermissionsTable;
