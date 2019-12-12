import { Rooms } from '../../../models/server/raw';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';

export async function findChannelAndPrivateAutocomplete({ uid, selector }) {
	if (!await hasPermissionAsync(uid, 'view-other-user-channels')) {
		throw new Error('error-not-authorized');
	}
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

	const rooms = await Rooms.findChannelAndPrivateByNameStarting(selector.name, options).toArray();

	return {
		items: rooms,
	};
}
