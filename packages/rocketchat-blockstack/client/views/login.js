import { Accounts } from 'meteor/accounts-base';
import { ServiceConfiguration } from 'meteor/service-configuration';

// Replace normal login form with Blockstack button
Template.blockstackLogin.replaces('loginForm');

Template.loginForm.helpers({
	// Render button when services configuration complete and determine the host
	// for auth request depending on client. On desktop we us localhost auth,
	// otherwise web auth - @NB: Host is ignored unless using `makeAuthRequest`
	configurationLoaded() {
		if (Accounts.loginServicesConfigured()) {
			const config = ServiceConfiguration.configurations.findOne({
				service: 'blockstack'
			});
			Template.currentData().blockstack = config;
			Template.currentData().blockstack.blockstackIDHost = (Meteor.Device.isDesktop())
				? 'http://localhost:8888/auth'
				: 'https://blockstack.org/auth';
			return true;
		} else {
			return false;
		}
	},
	// Login method can be changed to toggle password form or Blockstack signin
	isPasswordLogin() {
		return (FlowRouter.getQueryParam('login') === 'password');
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
		const config = Template.currentData().blockstack;
		const handler = (error) => {
			if (error) {
				Session.set('errorMessage', error.reason || 'Unknown error');
				return t.state.set('login');
			}
		};
		Meteor.loginWithBlockstack(config, handler);
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
