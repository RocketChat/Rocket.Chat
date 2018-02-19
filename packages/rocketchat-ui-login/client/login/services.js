/* globals CustomOAuth */
import s from 'underscore.string';
import toastr from 'toastr';

Meteor.startup(function() {
	return ServiceConfiguration.configurations.find({
		custom: true
	}).observe({
		added(record) {
			return new CustomOAuth(record.service, {
				serverURL: record.serverURL,
				authorizePath: record.authorizePath,
				scope: record.scope
			});
		}
	});
});

Template.loginServices.helpers({
	loginService() {
		const services = [];
		const authServices = ServiceConfiguration.configurations.find({}, {
			sort: {
				service: 1
			}
		}).fetch();
		authServices.forEach(function(service) {
			let icon;
			let serviceName;
			switch (service.service) {
				case 'meteor-developer':
					serviceName = 'Meteor';
					icon = 'meteor';
					break;
				case 'github':
					serviceName = 'GitHub';
					icon = 'github-circled';
					break;
				case 'gitlab':
					serviceName = 'GitLab';
					icon = service.service;
					break;
				case 'wordpress':
					serviceName = 'WordPress';
					icon = service.service;
					break;
				default:
					serviceName = s.capitalize(service.service);
					icon = service.service;
			}
			return services.push({
				service,
				displayName: serviceName,
				icon
			});
		});
		return services;
	}
});

const longinMethods = {
	'meteor-developer': 'MeteorDeveloperAccount',
	'linkedin': 'Linkedin'
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
		if (Meteor.isCordova && this.service.service === 'facebook') {
			return Meteor.loginWithFacebookCordova({}, function(error) {
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
		} else {
			const loginWithService = `loginWith${ longinMethods[this.service.service] || s.capitalize(this.service.service) }`;
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
		}
	}
});
