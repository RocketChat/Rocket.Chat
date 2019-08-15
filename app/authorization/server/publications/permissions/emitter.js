import Settings from '../../../../models/server/models/Settings';
import { Notifications } from '../../../../notifications/server';
import { CONSTANTS } from '../../../lib';


Permissions.on('change', ({ clientAction, id, data, diff }) => {
	if (diff && Object.keys(diff).length === 1 && diff._updatedAt) {
		// avoid useless changes
		return;
	}
	switch (clientAction) {
		case 'updated':
		case 'inserted':
			data = data || Permissions.findOneById(id);
			break;

		case 'removed':
			data = { _id: id };
			break;
	}

	Notifications.notifyLoggedInThisInstance(
		'permissions-changed',
		clientAction,
		data
	);
});

Permissions.on('change', ({ clientAction, id, data }) => {
	switch (clientAction) {
		case 'updated':
		case 'inserted':
			data = data || Permissions.findOneById(id);
			break;

		case 'removed':
			data = { _id: id };
			break;
	}

	Notifications.notifyLoggedInThisInstance(
		'permissions-changed',
		clientAction,
		data
	);

	if (data.level && data.level === CONSTANTS.SETTINGS_LEVEL) {
		// if the permission changes, the effect on the visible settings depends on the role affected.
		// The selected-settings-based consumers have to react accordingly and either add or remove the
		// setting from the user's collection
		const setting = Settings.findOneById(data.settingId);
		Notifications.notifyLoggedInThisInstance(
			'private-settings-changed',
			'updated',
			setting
		);
	}
});
