import type { IRole, IPermission } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import { useCallback, useMemo } from 'react';

import { usePermissionsKeys } from './usePermissionsKeys';
import { CONSTANTS } from '../../../../../app/authorization/lib';
import { Permissions, Roles } from '../../../../../app/models/client';
import { useReactiveValue } from '../../../../hooks/useReactiveValue';

export const usePermissionsAndRoles = (
	type = 'permissions',
	filter = '',
	limit = 25,
	skip = 0,
): { permissions: IPermission[]; total: number; roleList: IRole[]; reload: () => void } => {
	const permissionsKeys = usePermissionsKeys();

	const filteredIds = useMemo(() => {
		const regexp = new RegExp(escapeRegExp(filter), 'i');
		return permissionsKeys.filter(({ _id, i18nLabel }) => regexp.test(_id) || regexp.test(i18nLabel)).map(({ _id }) => _id);
	}, [filter, permissionsKeys]);

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
