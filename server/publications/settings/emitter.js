import { Settings } from '../../../app/models';
import { Notifications } from '../../../app/notifications';
import { hasPermission } from '../../../app/authorization';
import { settings } from '/app/settings/server';
import { redisMessageHandlers } from '/app/redis/handleRedisMessage';

const handleSetting = (clientAction, id, data, diff) => {
	if (diff && Object.keys(diff).length === 1 && diff._updatedAt) {
		// avoid useless changes
		return;
	}
	switch (clientAction) {
		case 'updated':
		case 'inserted': {
			const setting = data || Settings.findOneById(id);
			const value = {
				_id: setting._id,
				value: setting.value,
				editor: setting.editor,
				properties: setting.properties,
			};

			if (setting.public === true) {
				Notifications.notifyAllInThisInstance(
					'public-settings-changed',
					clientAction,
					value
				);
			}
			Notifications.notifyLoggedInThisInstance(
				'private-settings-changed',
				clientAction,
				setting
			);
			break;
		}

		case 'removed': {
			const setting =
				data || Settings.findOneById(id, { fields: { public: 1 } });

			if (setting && setting.public === true) {
				Notifications.notifyAllInThisInstance(
					'public-settings-changed',
					clientAction,
					{ _id: id }
				);
			}
			Notifications.notifyLoggedInThisInstance(
				'private-settings-changed',
				clientAction,
				{ _id: id }
			);
			break;
		}
	}
};

const handleSettingRedis = (data) => handleSetting(data.clientAction, data, data._id);

if (settings.get('Use_Oplog_As_Real_Time')) {
	Settings.on('change', ({ clientAction, id, data, diff }) => {
		handleSetting(clientAction, id, data, diff);
	});
} else {
	Settings.on('change', ({ clientAction, id, data, diff }) => {
		console.log('settings changed');
		
		data = data || Settings.findOneById(id);
		const newdata = {
			...data,
			ns: 'rocketchat_settings',
			clientAction,
		};
		// publishToRedis(`all`, newdata);
	});
}

Notifications.streamAll.allowRead('private-settings-changed', function () {
	if (this.userId == null) {
		return false;
	}
	return hasPermission(this.userId, 'view-privileged-setting');
});

redisMessageHandlers['rocketchat_settings'] = handleSettingRedis;
