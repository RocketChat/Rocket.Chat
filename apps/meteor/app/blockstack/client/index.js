import { Meteor } from 'meteor/meteor';
import { ServiceConfiguration } from 'meteor/service-configuration';
import { check, Match } from 'meteor/check';
import { Session } from 'meteor/session';
import './routes';

const handleError = (error) => error && Session.set('errorMessage', error.reason || 'Unknown error');

// TODO: allow serviceConfig.loginStyle == popup
Meteor.loginWithBlockstack = (options, callback = handleError) => {
	if (!options || !options.redirectURI) {
		options = ServiceConfiguration.configurations.findOne({
			service: 'blockstack',
		});

		options.blockstackIDHost = Meteor.Device.isDesktop() ? 'http://localhost:8888/auth' : 'https://blockstack.org/auth';

		options.scopes = ['store_write'];
	}

	try {
		check(
			options,
			Match.ObjectIncluding({
				blockstackIDHost: String,
				redirectURI: String,
				manifestURI: String,
			}),
		);

		import('blockstack/dist/blockstack').then(({ redirectToSignIn }) =>
			redirectToSignIn(options.redirectURI, options.manifestURI, options.scopes),
		);
	} catch (err) {
		callback.call(Meteor, err);
	}
};

const meteorLogout = Meteor.logout;
Meteor.logout = (...args) => {
	const serviceConfig = ServiceConfiguration.configurations.findOne({
		service: 'blockstack',
	});

	const blockstackAuth = Session.get('blockstack_auth');

	if (serviceConfig && blockstackAuth) {
		Session.delete('blockstack_auth');
		import('blockstack/dist/blockstack').then(({ signUserOut }) => signUserOut(window.location.href));
	}

	return meteorLogout(...args);
};
