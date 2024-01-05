import type { LoginServiceConfiguration } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import { ServiceConfiguration } from 'meteor/service-configuration';

import { CustomOAuth } from '../../app/custom-oauth/client/custom_oauth_client';

Meteor.startup(() => {
	ServiceConfiguration.configurations
		.find({
			custom: true,
		})
		.observe({
			async added(record) {
				const service = record as LoginServiceConfiguration | undefined;

				if (!service?.custom) {
					return;
				}

				new CustomOAuth(service.service, {
					serverURL: service.serverURL,
					authorizePath: service.authorizePath,
					scope: service.scope,
				});
			},
		});
});
