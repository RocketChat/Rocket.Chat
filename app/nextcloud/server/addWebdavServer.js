import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../callbacks';

callbacks.add('afterValidateLogin', (login) => {
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
		Meteor.runAsUser(user._id, () => {
			Meteor.call('addWebdavAccountByToken', data, function(error, response) {
				if (error) {
					console.log(error);
				} else if (!response.success) {
					console.log(response);
				}
			});
		});
	} catch (error) {
		console.log(error);
	}
});
