import { capitalize } from '@rocket.chat/string-helpers';
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ServiceConfiguration } from 'meteor/service-configuration';

import { dispatchToastMessage } from '../../../../client/lib/toast';

Template.loginServices.helpers({
	loginService() {
		return ServiceConfiguration.configurations
			.find(
				{
					showButton: { $ne: false },
				},
				{
					sort: {
						service: 1,
					},
				},
			)
			.fetch()
			.map((service) => {
				switch (service.service) {
					case 'meteor-developer':
						return {
							service,
							displayName: 'Meteor',
							icon: 'meteor',
						};

					case 'github':
						return {
							service,
							displayName: 'GitHub',
							icon: 'github-circled',
						};

					case 'gitlab':
						return {
							service,
							displayName: 'GitLab',
							icon: service.service,
						};

					case 'wordpress':
						return {
							service,
							displayName: 'WordPress',
							icon: service.service,
						};

					default:
						return {
							service,
							displayName: capitalize(String(service.service || '')),
							icon: service.service,
						};
				}
			});
	},
});

const loginMethods = {
	'meteor-developer': 'MeteorDeveloperAccount',
	'linkedin': 'Linkedin',
};

Template.loginServices.events({
	'click .external-login'(e) {
		if (this.service == null || this.service.service == null) {
			return;
		}

		const loadingIcon = $(e.currentTarget).find('.loading-icon');
		const serviceIcon = $(e.currentTarget).find('.service-icon');
		loadingIcon.removeClass('hidden');
		serviceIcon.addClass('hidden');

		const loginWithService = `loginWith${loginMethods[this.service.service] || capitalize(String(this.service.service || ''))}`;
		const serviceConfig = this.service.clientConfig || {};

		Meteor[loginWithService](serviceConfig, (error) => {
			loadingIcon.addClass('hidden');
			serviceIcon.removeClass('hidden');

			if (!error) {
				return;
			}

			if (error.reason) {
				dispatchToastMessage({ type: 'error', message: error.reason });
				return;
			}

			dispatchToastMessage({ type: 'error', message: error.message });
		});
	},
});
