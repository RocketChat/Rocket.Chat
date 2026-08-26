import { Meteor } from 'meteor/meteor';

import { isPlainObject } from '../../../lib/utils/isPlainObject';
import { hasPermissionAsync } from '../../lib/authorization/hasPermission';
import { API } from '../api';
import type { GenericRouteExecutionContext } from '../definition';

export async function parseJsonQuery(api: GenericRouteExecutionContext): Promise<{
	sort: Record<string, 1 | -1>;
	fields: Record<string, 0 | 1>;
}> {
	const { userId = '', route, logger } = api;
	const isUsersRoute = route.includes('/v1/users.');
	const params = isPlainObject(api.queryParams) ? api.queryParams : {};

	let sort;
	if (typeof params?.sort === 'string') {
		try {
			sort = JSON.parse(params.sort);
			Object.entries(sort).forEach(([key, value]) => {
				if (value !== 1 && value !== -1) {
					throw new Meteor.Error('error-invalid-sort-parameter', `Invalid sort parameter: ${key}`, {
						helperMethod: 'parseJsonQuery',
					});
				}
			});
		} catch (e) {
			logger.warn({
				msg: 'Invalid sort parameter provided',
				sort: params.sort,
				err: e,
			});
			throw new Meteor.Error('error-invalid-sort', `Invalid sort parameter provided: \"${params.sort}\"`, {
				helperMethod: 'parseJsonQuery',
			});
		}
	}

	const fields: Record<string, 0 | 1> = { ...(API.v1.defaultFieldsToExclude as Record<string, 0 | 1>) };

	if (isUsersRoute) {
		Object.assign(
			fields,
			(await hasPermissionAsync(userId, 'view-full-other-user-info'))
				? API.v1.limitedUserFieldsToExcludeIfIsPrivilegedUser
				: API.v1.limitedUserFieldsToExclude,
		);
	}

	return {
		sort,
		fields,
	};
}
