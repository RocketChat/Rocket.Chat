import { Notifications } from '../../../app/notifications';
import { Users } from '../../../app/models';
import { getDefaultUserFields } from '../../../app/utils/server/functions/getDefaultUserFields';

Users.on('change', ({ clientAction, id, data }) => {
	switch (clientAction) {
		case 'inserted':
			data = Users.find({ _id: id }, { fields: getDefaultUserFields() });
			break;

		case 'updated':
			// Override data cuz we do not publish all fields
			data = Users.find({ _id: id }, { fields: getDefaultUserFields() });
			break;

		case 'removed':
	}
	Notifications.streamUser.__emit(data._id, clientAction, data);

	Notifications.notifyUserInThisInstance(
		data._id,
		'ownUser-changed',
		clientAction,
		data
	);
});
