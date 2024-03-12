import { Meteor } from 'meteor/meteor';

import { CustomOAuth } from '../../app/custom-oauth/client/CustomOAuth';
import { loginServices } from '../lib/loginServices';

Meteor.startup(() => {
	loginServices.onLoad((services) => {
		for (const service of services) {
			if (!('custom' in service && service.custom)) {
				continue;
			}

			new CustomOAuth(service.service, {
				serverURL: service.serverURL,
				authorizePath: service.authorizePath,
				scope: service.scope,
			});
		}
	});
});
