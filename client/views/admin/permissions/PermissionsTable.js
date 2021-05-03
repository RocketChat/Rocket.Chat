import { Margins, Icon, Tabs, Button } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useState, useCallback } from 'react';

import { ChatPermissions } from '../../../../app/authorization/client/lib/ChatPermissions';
import { CONSTANTS } from '../../../../app/authorization/lib';
import { Roles } from '../../../../app/models/client';
import GenericTable from '../../../components/GenericTable';
import Page from '../../../components/Page';
import { usePermission } from '../../../contexts/AuthorizationContext';
import { useRoute } from '../../../contexts/RouterContext';
import { useMethod } from '../../../contexts/ServerContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useReactiveValue } from '../../../hooks/useReactiveValue';
import FilterComponent from './FilterComponent';
import PermissionRow from './PermissionRow';
import PermissionsContextBar from './PermissionsContextBar';
import RoleHeader from './RoleHeader';

const usePermissionsAndRoles = (type = 'permissions', filter = '', limit = 25, skip = 0) => {
	const getPermissions = useCallback(() => {
		const filterRegExp = new RegExp(filter, 'i');

		return ChatPermissions.find(
			{
				level:
					type === 'permissions' ? { $ne: CONSTANTS.SETTINGS_LEVEL } : CONSTANTS.SETTINGS_LEVEL,
				_id: filterRegExp,
			},
			{
				sort: {
					_id: 1,
				},
				skip,
				limit,
			},
		);
	}, [filter, limit, skip, type]);

	const getRoles = useMutableCallback(() => Roles.find().fetch(), []);

	const permissions = useReactiveValue(getPermissions);
	const roles = useReactiveValue(getRoles);

	return [permissions.fetch(), permissions.count(false), roles];
};

const PermissionsTable = () => {
	const t = useTranslation();
	const [filter, setFilter] = useState('');
	const canViewPermission = usePermission('access-permissions');
	const canViewSettingPermission = usePermission('access-setting-permissions');
	const defaultType = canViewPermission ? 'permissions' : 'settings';
	const [type, setType] = useState(defaultType);
	const [params, setParams] = useState({ limit: 25, skip: 0 });

	const router = useRoute('admin-permissions');

	const grantRole = useMethod('authorization:addPermissionToRole');
	const removeRole = useMethod('authorization:removeRoleFromPermission');

	const permissionsData = usePermissionsAndRoles(type, filter, params.limit, params.skip);

	const [permissions, total, roleList] = permissionsData;

	const handleParams = useMutableCallback(({ current, itemsPerPage }) => {
		setParams({ skip: current, limit: itemsPerPage });
	});

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
		router.push({
			context: 'new',
		});
	});

	return (
		<Page flexDirection='row'>
			<Page>
				<Page.Header title={t('Permissions')}>
					<Button small square onClick={handleAdd}>
						<Icon name='plus' />
					</Button>
				</Page.Header>
				<Margins blockEnd='x8'>
					<Tabs>
						<Tabs.Item
							selected={type === 'permissions'}
							onClick={handlePermissionsTab}
							disabled={!canViewPermission}
						>
							{t('Permissions')}
						</Tabs.Item>
						<Tabs.Item
							selected={type === 'settings'}
							onClick={handleSettingsTab}
							disabled={!canViewSettingPermission}
						>
							{t('Settings')}
						</Tabs.Item>
					</Tabs>
				</Margins>
				<Page.Content mb='neg-x8'>
					<Margins block='x8'>
						<FilterComponent onChange={setFilter} />
						<GenericTable
							header={
								<>
									<GenericTable.HeaderCell width='x120'>{t('Name')}</GenericTable.HeaderCell>
									{roleList.map(({ _id, description }) => (
										<RoleHeader key={_id} _id={_id} description={description} router={router} />
									))}
								</>
							}
							total={total}
							results={permissions}
							params={params}
							setParams={handleParams}
							fixed={false}
						>
							{useCallback(
								(permission) => (
									<PermissionRow
										key={permission._id}
										permission={permission}
										t={t}
										roleList={roleList}
										onGrant={grantRole}
										onRemove={removeRole}
									/>
								),
								[grantRole, removeRole, roleList, t],
							)}
						</GenericTable>
					</Margins>
				</Page.Content>
			</Page>
			<PermissionsContextBar />
		</Page>
	);
};

export default PermissionsTable;
