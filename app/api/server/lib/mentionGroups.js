// import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { MentionGroups } from '../../../models/server/raw';

export async function findMentionGroupAutocomplete({ /* uid,*/ selector }) {
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

	const groups = await MentionGroups.findByNameContaining(selector.name, options, selector.exceptions).toArray();

	return {
		items: groups,
	};
}
