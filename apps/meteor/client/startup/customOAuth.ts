import { isOauthCustomConfiguration } from '@rocket.chat/rest-typings';
import { Meteor } from 'meteor/meteor';
import { ServiceConfiguration } from 'meteor/service-configuration';

import { CustomOAuth } from '../../app/custom-oauth/client/custom_oauth_client';

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
