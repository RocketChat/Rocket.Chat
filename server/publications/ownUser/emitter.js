import { Notifications } from '../../../app/notifications';
import { Users } from '../../../app/models';
import { getDefaultUserFields } from '../../../app/utils/server/functions/getDefaultUserFields';

Users.on('change', ({ clientAction, id, data }) => {
	switch (clientAction) {
		case 'inserted':
			data = Users.findOneById(id, { fields: getDefaultUserFields() });
			break;

		case 'updated':
			// Override data cuz we do not publish all fields
			data = Users.findOneById(id, { fields: getDefaultUserFields() });
			break;

		case 'removed':
			data = Users.findOneById(id, { fields: getDefaultUserFields() });
			break;
	}
	// Notifications.streamUser.__emit(data._id, clientAction, data);
	Notifications.notifyUserInThisInstance(
		id,
		'ownUser-changed',
		clientAction,
		data
	);
});
