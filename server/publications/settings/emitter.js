import { Settings } from '../../../app/models/server';
import { Notifications } from '../../../app/notifications/server';
import { hasAtLeastOnePermission } from '../../../app/authorization/server';
import { SettingsEvents } from '../../../app/settings/server/functions/settings';

Settings.on('change', ({ clientAction, id, data, diff }) => {
	if (diff && Object.keys(diff).length === 1 && diff._updatedAt) { // avoid useless changes
		return;
	}
	switch (clientAction) {
		case 'updated':
		case 'inserted': {
			const setting = data ?? Settings.findOneById(id);
			const value = {
				_id: setting._id,
				value: setting.value,
				editor: setting.editor,
				properties: setting.properties,
				enterprise: setting.enterprise,
				requiredOnWizard: setting.requiredOnWizard,
			};

			SettingsEvents.emit('change-setting', setting, value);

			if (setting.hidden) {
				return;
			}

			if (setting.public === true) {
				Notifications.notifyAllInThisInstance('public-settings-changed', clientAction, value);
			}
			Notifications.notifyLoggedInThisInstance('private-settings-changed', clientAction, setting);
			break;
		}

		case 'removed': {
			const setting = data || Settings.findOneById(id, { fields: { public: 1 } });

			if (setting && setting.public === true) {
				Notifications.notifyAllInThisInstance('public-settings-changed', clientAction, { _id: id });
			}
			Notifications.notifyLoggedInThisInstance('private-settings-changed', clientAction, { _id: id });
			break;
		}
	}
});

Notifications.streamAll.allowRead('private-settings-changed', function() {
	if (this.userId == null) {
		return false;
	}
	return hasAtLeastOnePermission(this.userId, ['view-privileged-setting', 'edit-privileged-setting', 'manage-selected-settings']);
});
