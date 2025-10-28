import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../lib/callbacks';
import { SystemLogger } from '../../../server/lib/logger/system';
import { settings } from '../../settings/server';
import { addWebdavAccountByToken } from '../../webdav/server/methods/addWebdavAccount';

Meteor.startup(() => {
	settings.watch('Webdav_Integration_Enabled', (value) => {
		if (value) {
			return callbacks.add(
				'afterValidateLogin',
				async (login) => {
					const { user } = login;
					const { services } = user;
					if (!services?.nextcloud) {
						return;
					}
					const token = {
						token_type: 'Bearer',
						access_token: services.nextcloud.accessToken,
						refresh_token: services.nextcloud.refreshToken,
					};
					const data = {
						name: 'Nextcloud',
						serverURL: `${services.nextcloud.serverURL}/remote.php/webdav/`,
						token,
					};
					try {
						await addWebdavAccountByToken(user._id, data);
					} catch (error) {
						SystemLogger.error(error);
					}
				},
				callbacks.priority.MEDIUM,
				'add-webdav-server',
			);
		}
		callbacks.remove('afterValidateLogin', 'add-webdav-server');
	});
});
