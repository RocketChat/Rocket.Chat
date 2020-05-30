import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ServiceConfiguration } from 'meteor/service-configuration';
import s from 'underscore.string';
import toastr from 'toastr';

import { CustomOAuth } from '../../../custom-oauth';

Meteor.startup(function() {
	return ServiceConfiguration.configurations.find({
		custom: true,
	}).observe({
		added(record) {
			return new CustomOAuth(record.service, {
				serverURL: record.serverURL,
				authorizePath: record.authorizePath,
				scope: record.scope,
			});
		},
	});
});

Template.loginServices.helpers({
	loginService() {
		return ServiceConfiguration.configurations.find({
			showButton: { $ne: false },
		}, {
			sort: {
				service: 1,
			},
		}).fetch().map(function(service) {
			let icon;
			let displayName;
			switch (service.service) {
				case 'meteor-developer':
					displayName = 'Meteor';
					icon = 'meteor';
					break;
				case 'github':
					displayName = 'GitHub';
					icon = 'github-circled';
					break;
				case 'gitlab':
					displayName = 'GitLab';
					icon = service.service;
					break;
				case 'wordpress':
					displayName = 'WordPress';
					icon = service.service;
					break;
				default:
					displayName = s.capitalize(service.service);
					icon = service.service;
			}
			return {
				service,
				displayName,
				icon,
			};
		});
	},
});

const loginMethods = {
	'meteor-developer': 'MeteorDeveloperAccount',
	linkedin: 'Linkedin',
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

		const loginWithService = `loginWith${ loginMethods[this.service.service] || s.capitalize(this.service.service) }`;
		const serviceConfig = this.service.clientConfig || {};
		return Meteor[loginWithService](serviceConfig, function(error) {
			loadingIcon.addClass('hidden');
			serviceIcon.removeClass('hidden');
			if (error) {
				console.log(JSON.stringify(error));
				if (error.reason) {
					toastr.error(error.reason);
				} else {
					toastr.error(error.message);
				}
			}
		});
	},
});
