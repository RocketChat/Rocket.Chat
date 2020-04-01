// import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { Roles } from '../../../models/server/raw';

export async function findRoleAutocomplete({ /* uid,*/ selector }) {
	// if (!await hasPermissionAsync(uid, 'view-other-user-channels')) {
	// 	return { items: [] };
	// }
	const options = {
		fields: {
			_id: 1,
			name: 1,
		},
		limit: 10,
		sort: {
			name: 1,
		},
	};

	const roles = await Roles.findByNameContaining(selector.name, options, selector.exceptions).toArray();

	return {
		items: roles,
	};
}
