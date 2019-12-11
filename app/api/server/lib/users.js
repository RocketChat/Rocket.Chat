import { Users } from '../../../models/server/raw';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';

export async function findUsersToAutocomplete({ uid, selector }) {
	if (!await hasPermissionAsync(uid, 'view-outside-room')) {
		throw new Error('error-not-authorized');
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

	const users = await Users.findActiveByUsernameOrNameRegexWithExceptionsAndConditions(selector.term, exceptions, conditions, options).toArray();

	return {
		users,
	};
}
