import React, { useState, useCallback, useEffect } from 'react';
import { TextInput, Table, Margins, Box, Icon, CheckBox, Throbber, Tabs, Button } from '@rocket.chat/fuselage';
import { useMutableCallback, useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { css } from '@rocket.chat/css-in-js';

import Page from '../../../components/Page';
import PermissionsContextBar from './PermissionsContextBar';
import GenericTable from '../../../components/GenericTable';
import { useReactiveValue } from '../../../hooks/useReactiveValue';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useMethod } from '../../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
import { useRoute } from '../../../contexts/RouterContext';
import { ChatPermissions } from '../../../../app/authorization/client/lib/ChatPermissions';
import { CONSTANTS, AuthorizationUtils } from '../../../../app/authorization/lib';
import { Roles } from '../../../../app/models/client';

const useChangeRole = ({ onGrant, onRemove, permissionId }) => {
	const dispatchToastMessage = useToastMessageDispatch();
	return useMutableCallback(async (roleId, granted) => {
		try {
			if (granted) {
				await onRemove(permissionId, roleId);
			} else {
				await onGrant(permissionId, roleId);
			}
			return !granted;
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
		return granted;
	});
};


const usePermissionsAndRoles = (type = 'permissions', filter = '', limit = 25, skip = 0) => {
	const getPermissions = useCallback(() => {
		const filterRegExp = new RegExp(filter, 'i');

		return ChatPermissions.find(
			{
				level: type === 'permissions' ? { $ne: CONSTANTS.SETTINGS_LEVEL } : CONSTANTS.SETTINGS_LEVEL,
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

const RoleCell = React.memo(({ grantedRoles = [], _id, description, onChange, lineHovered, permissionId }) => {
	const [granted, setGranted] = useState(() => !!grantedRoles.includes(_id));
	const [loading, setLoading] = useState(false);

	const isRestrictedForRole = AuthorizationUtils.isPermissionRestrictedForRole(permissionId, _id);

	const handleChange = useMutableCallback(async () => {
		setLoading(true);
		const result = await onChange(_id, granted);
		setGranted(result);
		setLoading(false);
	});

	const isDisabled = !!loading || !!isRestrictedForRole;

	return <Table.Cell withTruncatedText>
		<Margins inline='x2'>
			<CheckBox checked={granted} onChange={handleChange} disabled={isDisabled}/>
			{!loading && <Box display='inline' color='hint' invisible={!lineHovered}>
				{description || _id}
			</Box>}
			{loading && <Throbber size='x12' display='inline-block'/>}
		</Margins>
	</Table.Cell>;
});

const getName = (t, permission) => {
	if (permission.level === CONSTANTS.SETTINGS_LEVEL) {
		let path = '';
		if (permission.group) {
			path = `${ t(permission.group) } > `;
		}
		if (permission.section) {
			path = `${ path }${ t(permission.section) } > `;
		}
		return `${ path }${ t(permission.settingId) }`;
	}

	return t(permission._id);
};

const PermissionRow = React.memo(({ permission, t, roleList, onGrant, onRemove, ...props }) => {
	const {
		_id,
		roles,
	} = permission;

	const [hovered, setHovered] = useState(false);

	const onMouseEnter = useMutableCallback(() => setHovered(true));
	const onMouseLeave = useMutableCallback(() => setHovered(false));

	const changeRole = useChangeRole({ onGrant, onRemove, permissionId: _id });
	return <Table.Row
		key={_id}
		role='link'
		action
		tabIndex={0}
		onMouseEnter={onMouseEnter}
		onMouseLeave={onMouseLeave}
		{...props}
	>
		<Table.Cell maxWidth='x300' withTruncatedText title={t(`${ _id }_description`)}>{getName(t, permission)}</Table.Cell>
		{roleList.map(({ _id, description }) => <RoleCell
			key={_id}
			_id={_id}
			description={description}
			grantedRoles={roles}
			onChange={changeRole}
			lineHovered={hovered}
			permissionId={_id}
		/>)}
	</Table.Row>;
});

const RoleHeader = React.memo(({ router, _id, description, ...props }) => {
	const onClick = useMutableCallback(() => {
		router.push({
			context: 'edit',
			_id,
		});
	});

	return <GenericTable.HeaderCell clickable pi='x4' p='x8' {...props}>
		<Box
			className={css`white-space: nowrap`}
			pb='x8'
			pi='x12'
			mi='neg-x2'
			borderStyle='solid'
			borderWidth='x2'
			borderRadius='x2'
			borderColor='neutral-300'
			onClick={onClick}
		>
			<Margins inline='x2'>
				<span>{description || _id}</span>
				<Icon name='edit' size='x16'/>
			</Margins>
		</Box>
	</GenericTable.HeaderCell>;
});

const FilterComponent = ({ onChange }) => {
	const t = useTranslation();
	const [filter, setFilter] = useState('');

	const debouncedFilter = useDebouncedValue(filter, 500);

	useEffect(() => {
		onChange(debouncedFilter);
	}, [debouncedFilter, onChange]);

	const handleFilter = useMutableCallback(({ currentTarget: { value } }) => {
		setFilter(value);
	});

	return <TextInput value={filter} onChange={handleFilter} placeholder={t('Search')} flexGrow={0}/>;
};

const PermissionsTable = () => {
	const t = useTranslation();
	const [filter, setFilter] = useState('');
	const [type, setType] = useState('permissions');
	const [params, setParams] = useState({ limit: 25, skip: 0 });

	const router = useRoute('admin-permissions');

	const grantRole = useMethod('authorization:addPermissionToRole');
	const removeRole = useMethod('authorization:removeRoleFromPermission');

	const permissionsData = usePermissionsAndRoles(type, filter, params.limit, params.skip);

	const [
		permissions,
		total,
		roleList,
	] = permissionsData;

	const handleParams = useMutableCallback(({ current, itemsPerPage }) => {
		setParams({ skip: current, limit: itemsPerPage });
	});

	const handlePermissionsTab = useMutableCallback(() => {
		if (type === 'permissions') { return; }
		setType('permissions');
	});

	const handleSettingsTab = useMutableCallback(() => {
		if (type === 'settings') { return; }
		setType('settings');
	});

	const handleAdd = useMutableCallback(() => {
		router.push({
			context: 'new',
		});
	});

	return <Page flexDirection='row'>
		<Page>
			<Page.Header title={t('Permissions')}>
				<Button small square onClick={handleAdd}>
					<Icon name='plus'/>
				</Button>
			</Page.Header>
			<Margins blockEnd='x8'>
				<Tabs>
					<Tabs.Item selected={type === 'permissions'} onClick={handlePermissionsTab}>
						{t('Permissions')}
					</Tabs.Item>
					<Tabs.Item selected={type === 'settings'} onClick={handleSettingsTab}>
						{t('Settings')}
					</Tabs.Item>
				</Tabs>
			</Margins>
			<Page.Content mb='neg-x8'>
				<Margins block='x8'>
					<FilterComponent onChange={setFilter}/>
					<GenericTable
						header={<>
							<GenericTable.HeaderCell width='x120'>{t('Name')}</GenericTable.HeaderCell>
							{roleList.map(({ _id, description }) => <RoleHeader key={_id} _id={_id} description={description} router={router}/>)}
						</>}
						total={total}
						results={permissions}
						params={params}
						setParams={handleParams}
						fixed={false}
					>
						{useCallback((permission) => <PermissionRow key={permission._id} permission={permission} t={t} roleList={roleList} onGrant={grantRole} onRemove={removeRole} />, [grantRole, removeRole, roleList, t])}
					</GenericTable>
				</Margins>
			</Page.Content>
		</Page>
		<PermissionsContextBar />
	</Page>;
};

export default PermissionsTable;
