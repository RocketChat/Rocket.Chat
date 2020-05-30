import s from 'underscore.string';

import { Users } from '../../../app/models/server/raw';
import { hasPermissionAsync } from '../../../app/authorization/server/functions/hasPermission';

export async function findUsersToAutocomplete({ uid, selector }) {
	if (!await hasPermissionAsync(uid, 'view-outside-room')) {
		return { items: [] };
	}
	const exceptions = selector.exceptions || [];
	const conditions = selector.conditions || {};
	const options = {
		fields: {
			name: 1,
			username: 1,
			status: 1,
		},
		sort: {
			username: 1,
		},
		limit: 10,
	};

	const users = await Users.findActiveByUsernameOrNameRegexWithExceptionsAndConditions(new RegExp(s.escapeRegExp(selector.term), 'i'), exceptions, conditions, options).toArray();

	return {
		items: users,
	};
}
