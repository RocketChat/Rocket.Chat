import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../callbacks';
import { settings } from '../../settings';

Meteor.startup(() => {
	settings.get('Webdav_Integration_Enabled', (key, value) => {
		if (value) {
			return callbacks.add('afterValidateLogin', (login) => {
				const { user } = login;
				const { services } = user;
				if (!services || !services.nextcloud) {
					return;
				}
				const token = {
					token_type: 'Bearer',
					access_token: services.nextcloud.accessToken,
					refresh_token: services.nextcloud.refreshToken,
				};
				const data = {
					name: 'Nextcloud',
					serverURL: `${ services.nextcloud.serverURL }/remote.php/webdav/`,
					token,
				};
				try {
					Meteor.runAsUser(user._id, () => Meteor.call('addWebdavAccountByToken', data));
				} catch (error) {
					console.log(error);
				}
			}, callbacks.priority.MEDIUM, 'add-webdav-server');
		}
		callbacks.remove('afterValidateLogin', 'add-webdav-server');
	});
});
