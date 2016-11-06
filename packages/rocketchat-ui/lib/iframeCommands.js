const commands = {
	go(data) {
		if (typeof data.path !== 'string' || data.path.trim().length === 0) {
			return console.error('`path` not defined');
		}
		let params = FlowRouter.current().queryParams;
		if (data.layout) {
			params.layout = data.layout;
		}

		FlowRouter.go(data.path, null, params);
	},


	'set-user-status'(data) {
		AccountBox.setStatus(data.status);
	},

	'call-custom-oauth-login'(data, event) {
		const customOAuthCallback = (response) => {
			event.source.postMessage({
				event: 'custom-oauth-callback',
				response: response
			}, event.origin);
		};

		if (typeof data.service === 'string') {
			const customOauth = ServiceConfiguration.configurations.findOne({service: data.service});

			if (customOauth) {
				const customLoginWith = Meteor['loginWith' + _.capitalize(customOauth.service, true)];
				const customRedirectUri = window.OAuth._redirectUri(customOauth.service, customOauth);
				customLoginWith.call(Meteor, {'redirectUrl': customRedirectUri}, customOAuthCallback);
			}
		}
	},

	'login-with-token'(data) {
		if (typeof data.token === 'string') {
			Meteor.loginWithToken(data.token, function() {
				console.log('Iframe command [login-with-token]: result', arguments);
			});
		}
	},

	'logout'() {
		const user = Meteor.user();
		Meteor.logout(() => {
			RocketChat.callbacks.run('afterLogoutCleanUp', user);
			Meteor.call('logoutCleanUp', user);
			return FlowRouter.go('home');
		});
	}
};

window.addEventListener('message', (e) => {
	if (RocketChat.settings.get('Iframe_Integration_receive_enable') !== true) {
		return;
	}

	if (typeof e.data !== 'object' || typeof e.data.externalCommand !== 'string') {
		return;
	}

	let origins = RocketChat.settings.get('Iframe_Integration_receive_origin');

	if (origins !== '*' && origins.split(',').indexOf(e.origin) === -1) {
		return console.error('Origin not allowed', e.origin);
	}

	const command = commands[e.data.externalCommand];
	if (command) {
		command(e.data, e);
	}
});
