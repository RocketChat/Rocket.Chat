import type { IRole, IPermission } from '@rocket.chat/core-typings';
import { useCallback } from 'react';
import { useShallow } from 'zustand/shallow';

import { useFilteredPermissions } from './useFilteredPermissions';
import { CONSTANTS } from '../../../../../app/authorization/lib';
import { pipe } from '../../../../lib/cachedStores';
import { Permissions, Roles } from '../../../../stores';

export const usePermissionsAndRoles = (
	type = 'permissions',
	filter = '',
	limit = 25,
	skip = 0,
): { permissions: IPermission[]; total: number; roleList: IRole[] } => {
	const filteredIds = useFilteredPermissions({ filter });

	const predicate = useCallback(
		(record: IPermission): boolean => {
			if (type === 'permissions') {
				return record.level !== CONSTANTS.SETTINGS_LEVEL && filteredIds.includes(record._id);
			}
			return record.level === CONSTANTS.SETTINGS_LEVEL && filteredIds.includes(record._id);
		},
		[filteredIds, type],
	);

	const { apply: transform } = pipe<IPermission>().sortByField('_id', 1).slice(skip, limit);
	const permissions = Permissions.use(useShallow((state) => transform(state.filter(predicate))));
	const permissionsTotal = Permissions.use(useShallow((state) => state.count(predicate)));

	const roleList = Roles.use(useShallow((state) => Array.from(state.records.values())));

	return { permissions, total: permissionsTotal, roleList };
};
