import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useCallback } from 'react';

import { ChatPermissions } from '../../../../../app/authorization/client/lib/ChatPermissions';
import { CONSTANTS } from '../../../../../app/authorization/lib';
import { Roles } from '../../../../../app/models/client';
import { useReactiveValue } from '../../../../hooks/useReactiveValue';

export const usePermissionsAndRoles = (type = 'permissions', filter = '', limit = 25, skip = 0): Array<any> => {
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

	const getRoles = useMutableCallback(() => Roles.find().fetch());

	const permissions = useReactiveValue(getPermissions);
	const roles = useReactiveValue(getRoles);

	const reloadRoles = getRoles();

	return [permissions.fetch(), permissions.count(false), roles, reloadRoles];
};
