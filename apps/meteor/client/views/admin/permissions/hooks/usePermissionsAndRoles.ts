import type { IRole, IPermission } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useCallback, useMemo } from 'react';

import { useFilteredPermissions } from './useFilteredPermissions';
import { CONSTANTS } from '../../../../../app/authorization/lib';
import { Permissions, Roles } from '../../../../../app/models/client';
import { useReactiveValue } from '../../../../hooks/useReactiveValue';

export const usePermissionsAndRoles = (
	type = 'permissions',
	filter = '',
	limit = 25,
	skip = 0,
): { permissions: IPermission[]; total: number; roleList: IRole[]; reload: () => void } => {
	const filteredIds = useFilteredPermissions({ filter });

	const selector = useMemo(() => {
		return {
			level: type === 'permissions' ? { $ne: CONSTANTS.SETTINGS_LEVEL } : CONSTANTS.SETTINGS_LEVEL,
			_id: { $in: filteredIds },
		};
	}, [filteredIds, type]);

	const getPermissions = useCallback(
		() =>
			Permissions.find(selector, {
				sort: {
					_id: 1,
				},
				skip,
				limit,
			}),
		[selector, skip, limit],
	);

	const getTotalPermissions = useCallback(() => Permissions.find(selector).count(), [selector]);

	const permissions = useReactiveValue(getPermissions);
	const permissionsTotal = useReactiveValue(getTotalPermissions);
	const getRoles = useEffectEvent(() => Roles.find().fetch());
	const roles = useReactiveValue(getRoles);

	return { permissions: permissions.fetch(), total: permissionsTotal, roleList: roles, reload: getRoles };
};
