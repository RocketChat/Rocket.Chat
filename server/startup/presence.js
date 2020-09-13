import { Meteor } from 'meteor/meteor';
import { InstanceStatus } from 'meteor/konecty:multiple-instances-status';
import { UserPresence, UserPresenceMonitor } from 'meteor/konecty:user-presence';

import InstanceStatusModel from '../../app/models/server/models/InstanceStatus';
import UsersSessionsModel from '../../app/models/server/models/UsersSessions';

Meteor.startup(function() {
	const instance = {
		host: 'localhost',
		port: String(process.env.PORT).trim(),
	};

	if (process.env.INSTANCE_IP) {
		instance.host = String(process.env.INSTANCE_IP).trim();
	}

	InstanceStatus.registerInstance('rocket.chat', instance);

	UserPresence.start();

	const startMonitor = typeof process.env.DISABLE_PRESENCE_MONITOR === 'undefined'
		|| !['true', 'yes'].includes(String(process.env.DISABLE_PRESENCE_MONITOR).toLowerCase());
	if (startMonitor) {
		// UserPresenceMonitor.start();

		// Remove lost connections
		const ids = InstanceStatusModel.find({}, { fields: { _id: 1 } }).fetch().map((id) => id._id);

		const update = {
			$pull: {
				connections: {
					instanceId: {
						$nin: ids,
					},
				},
			},
		};
		UsersSessionsModel.update({}, update, { multi: true });

		InstanceStatusModel.on('change', ({ clientAction, id }) => {
			switch (clientAction) {
				case 'removed':
					UserPresence.removeConnectionsByInstanceId(id);
					break;
			}
		});

		UsersSessionsModel.on('change', ({ clientAction, id, data }) => {
			switch (clientAction) {
				case 'inserted':
					UserPresenceMonitor.processUserSession(data, 'added');
					break;
				case 'updated':
					data = data ?? UsersSessionsModel.findOneById(id);
					if (data) {
						UserPresenceMonitor.processUserSession(data, 'changed');
					}
					break;
				case 'removed':
					UserPresenceMonitor.processUserSession({
						_id: id,
						connections: [{
							fake: true,
						}],
					}, 'removed');
					break;
			}
		});
	}
});
