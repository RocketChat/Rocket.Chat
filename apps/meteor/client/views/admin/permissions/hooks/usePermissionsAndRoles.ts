import type { IRole, IPermission } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useCallback } from 'react';

import { ChatPermissions } from '../../../../../app/authorization/client/lib/ChatPermissions';
import { CONSTANTS } from '../../../../../app/authorization/lib';
import { Roles } from '../../../../../app/models/client';
import { useReactiveValue } from '../../../../hooks/useReactiveValue';

export const usePermissionsAndRoles = (
	type = 'permissions',
	filter = '',
	limit = 25,
	skip = 0,
): { permissions: IPermission[]; total: number; roleList: IRole[]; reload: () => void } => {
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

	const permissions = useReactiveValue(getPermissions);
	const getRoles = useMutableCallback(() => Roles.find().fetch());
	const roles = useReactiveValue(getRoles);

	return { permissions: permissions.fetch(), total: permissions.count(false), roleList: roles, reload: getRoles };
};
