import { Users } from '../../../models/server/raw';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { escapeRegExp } from '../../../../lib/escapeRegExp';

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
			nickname: 1,
			status: 1,
			avatarETag: 1,
		},
		sort: {
			username: 1,
		},
		limit: 10,
	};

	const users = await Users.findActiveByUsernameOrNameRegexWithExceptionsAndConditions(new RegExp(escapeRegExp(selector.term), 'i'), exceptions, conditions, options).toArray();

	return {
		items: users,
	};
}

/**
 * Returns a new query object with the inclusive fields only
 * @param {Object} query search query for matching rows
 */
export function getInclusiveFields(query) {
	const newQuery = {};

	for (const [key, value] of Object.entries(query)) {
		if (value === 1) {
			newQuery[key] = value;
		}
	}

	return newQuery;
}
