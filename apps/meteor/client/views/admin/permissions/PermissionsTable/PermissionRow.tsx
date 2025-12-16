import type { IRole, IPermission } from '@rocket.chat/core-typings';
import { GenericTableRow, GenericTableCell } from '@rocket.chat/ui-client';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import type { TFunction } from 'i18next';
import type { ReactElement } from 'react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import RoleCell from './RoleCell';
import { CONSTANTS } from '../../../../../app/authorization/lib';
import { useChangeRole } from '../hooks/useChangeRole';

const getName = (t: TFunction, permission: IPermission): string => {
	if (permission.level === CONSTANTS.SETTINGS_LEVEL) {
		let path = '';
		if (permission.group) {
			path = `${t(permission.group as TranslationKey)} > `;
		}
		if (permission.section) {
			path = `${path}${t(permission.section as TranslationKey)} > `;
		}
		return `${path}${t(permission.settingId as TranslationKey)}`;
	}

	return t(permission._id as TranslationKey);
};

type PermissionRowProps = {
	permission: IPermission;
	roleList: IRole[];
	onGrant: (permissionId: IPermission['_id'], roleId: IRole['_id']) => Promise<void>;
	onRemove: (permissionId: IPermission['_id'], roleId: IRole['_id']) => Promise<void>;
};

const PermissionRow = ({ permission, roleList, onGrant, onRemove }: PermissionRowProps): ReactElement => {
	const { t } = useTranslation();
	const { _id: permissionId, roles } = permission;
	const changeRole = useChangeRole({ onGrant, onRemove, permissionId });
	const permissionName = getName(t, permission);

	return (
		<GenericTableRow key={permissionId} role='link' action tabIndex={0}>
			<GenericTableCell maxWidth='x300' withTruncatedText title={t(`${permissionId}_description` as TranslationKey)}>
				{permissionName}
			</GenericTableCell>
			{roleList.map(({ _id: roleId, name, description }) => (
				<RoleCell
					key={roleId}
					_id={roleId}
					name={name}
					description={description}
					grantedRoles={roles}
					onChange={changeRole}
					permissionId={permissionId}
					permissionName={permissionName}
				/>
			))}
		</GenericTableRow>
	);
};

export default memo(PermissionRow);
