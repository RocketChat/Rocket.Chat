import { Table } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useState, memo } from 'react';

import { CONSTANTS } from '../../../../app/authorization/lib';
import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
import RoleCell from './RoleCell';

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

const getName = (t, permission) => {
	if (permission.level === CONSTANTS.SETTINGS_LEVEL) {
		let path = '';
		if (permission.group) {
			path = `${t(permission.group)} > `;
		}
		if (permission.section) {
			path = `${path}${t(permission.section)} > `;
		}
		return `${path}${t(permission.settingId)}`;
	}

	return t(permission._id);
};

const PermissionRow = ({ permission, t, roleList, onGrant, onRemove, ...props }) => {
	const { _id, roles } = permission;

	const [hovered, setHovered] = useState(false);

	const onMouseEnter = useMutableCallback(() => setHovered(true));
	const onMouseLeave = useMutableCallback(() => setHovered(false));

	const changeRole = useChangeRole({ onGrant, onRemove, permissionId: _id });
	return (
		<Table.Row key={_id} role='link' action tabIndex={0} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} {...props}>
			<Table.Cell maxWidth='x300' withTruncatedText title={t(`${_id}_description`)}>
				{getName(t, permission)}
			</Table.Cell>
			{roleList.map(({ _id, name, description }) => (
				<RoleCell
					key={_id}
					_id={_id}
					name={name}
					description={description}
					grantedRoles={roles}
					onChange={changeRole}
					lineHovered={hovered}
					permissionId={_id}
				/>
			))}
		</Table.Row>
	);
};

export default memo(PermissionRow);
