import { Meteor } from 'meteor/meteor';
import { ServiceConfiguration } from 'meteor/service-configuration';

import { CustomOAuth } from '../../app/custom-oauth/client/custom_oauth_client';
import { isOauthCustomConfiguration } from '../../definition/rest/v1/settings';

Meteor.startup(() => {
	ServiceConfiguration.configurations
		.find({
			custom: true,
		})
		.observe({
			added(record) {
				if (!isOauthCustomConfiguration(record)) {
					return;
				}

				new CustomOAuth(record.service, {
					serverURL: record.serverURL,
					authorizePath: record.authorizePath,
					scope: record.scope,
				});
			},
		});
});
