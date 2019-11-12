import { Notifications } from '../../../app/notifications';
import { Users } from '../../../app/models';
import { msgStream } from '../../../app/lib/server/lib/msgStream';

import { getDefaultUserFields } from '../../../app/utils/server/functions/getDefaultUserFields';

Users.on('change', ({ clientAction, id, data }) => {
	switch (clientAction) {
		case 'inserted':
		case 'updated':
			// Override data cuz we do not publish all fields
			data = Users.find({ _id: id }, {
				fields: getDefaultUserFields(),
			});
			break;

		case 'removed':
			data = Users.find({ _id: id }, {
				fields: getDefaultUserFields(),
			});
			// emit a removed event
			msgStream.__emit(data._id, clientAction, data);
			break;
	}

	Notifications.streamUser.__emit(data._id, clientAction, data);
});
