import { Accounts } from 'meteor/accounts-base';
import { ServiceConfiguration } from 'meteor/service-configuration';

// Replace normal login form with Blockstack button
Template.blockstackLogin.replaces('loginForm');

// On template creation, get the service configs ready for login
Template.loginForm.onCreated(function() {
	this.blockstackConfig = ServiceConfiguration.configurations.findOne({
		service: 'blockstack'
	});
});

// Determine where to send long events depending on client
// on desktop (or development) we use the localhost auth, otherwise web auth
Template.loginForm.onRendered(function() {
	this.autorun(() => {
		// if (Meteor.Device.isDesktop() || Meteor.isDevelopment) {
		if (Meteor.Device.isDesktop()) {
			this.blockstackConfig.blockstackIDHost = 'http://localhost:8888/auth';
		} else {
			this.blockstackConfig.blockstackIDHost = 'https://blockstack.org/auth';
		}
	});
});

// Render button when services configuration complete
Template.loginForm.helpers({
	isPasswordLogin() {
		return (FlowRouter.getQueryParam('login') === 'password');
	},
	configurationLoaded() {
		return Accounts.loginServicesConfigured();
	},
	changeLoginLink() {
		if (FlowRouter.getQueryParam('login') === 'password') {
			return `<p><a href="#" id="blockstackLogin">${ TAPi18n.__('Login_with_blockstack') }</a></p>`;
		} else {
			return `<p><a href="#" id="passwordLogin">${ TAPi18n.__('Login_with_password') }</a></p>`;
		}
	},
	poweredByRocketChat() {
		return '<p>Powered by <a href="https://rocket.chat">Rocket.Chat</a> and <a href="https://blockstack.org">Blockstack</a></p>';
	}
});

// Trigger login (redirect or popup) on click
Template.loginForm.events({
	'click #signin-button'(e, t) {
		e.preventDefault();
		t.loading.set(true);
		Meteor.loginWithBlockstack(t.blockstackConfig, (error) => {
			if (error) {
				Session.set('errorMessage', error.reason || 'Unknown error');
				return t.state.set('login');
			}
		});
	},
	'click #passwordLogin'(e) {
		e.preventDefault();
		FlowRouter.setQueryParams({ login: 'password' });
	},
	'click #blockstackLogin'(e) {
		e.preventDefault();
		FlowRouter.setQueryParams({ login: null });
	}
});
