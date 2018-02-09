// Replace normal login form with Blockstack button
Template.blockstackLogin.replaces('loginForm');

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
		return `<p>${ TAPi18n.__('Powered_by_open_source') } <a href="https://rocket.chat">Rocket.Chat</a></p>`;
	}
});

// Trigger login (redirect or popup) on click
Template.loginForm.events({
	'click #signin-button'(e, t) {
		e.preventDefault();
		t.loading.set(true);
		const config = ServiceConfiguration.configurations.findOne({ service: 'blockstack' });
		console.log(config);
		Meteor.loginWithBlockstack(config, (error) => {
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
