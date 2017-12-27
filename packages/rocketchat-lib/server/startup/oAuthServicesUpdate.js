/* globals CustomOAuth */
import _ from 'underscore';

const logger = new Logger('rocketchat:lib', {
	methods: {
		oauth_updated: {
			type: 'info'
		}
	}
});

function _OAuthServicesUpdate() {
	const services = RocketChat.settings.get(/^(Accounts_OAuth_|Accounts_OAuth_Custom-)[a-z0-9_]+$/i);
	services.forEach((service) => {
		logger.oauth_updated(service.key);
		let serviceName = service.key.replace('Accounts_OAuth_', '');
		if (serviceName === 'Meteor') {
			serviceName = 'meteor-developer';
		}
		if (/Accounts_OAuth_Custom-/.test(service.key)) {
			serviceName = service.key.replace('Accounts_OAuth_Custom-', '');
		}
		if (service.value === true) {
			const data = {
				clientId: RocketChat.settings.get(`${ service.key }_id`),
				secret: RocketChat.settings.get(`${ service.key }_secret`)
			};
			if (/Accounts_OAuth_Custom-/.test(service.key)) {
				data.custom = true;
				data.clientId = RocketChat.settings.get(`${ service.key }-id`);
				data.secret = RocketChat.settings.get(`${ service.key }-secret`);
				data.serverURL = RocketChat.settings.get(`${ service.key }-url`);
				data.tokenPath = RocketChat.settings.get(`${ service.key }-token_path`);
				data.identityPath = RocketChat.settings.get(`${ service.key }-identity_path`);
				data.authorizePath = RocketChat.settings.get(`${ service.key }-authorize_path`);
				data.scope = RocketChat.settings.get(`${ service.key }-scope`);
				data.buttonLabelText = RocketChat.settings.get(`${ service.key }-button_label_text`);
				data.buttonLabelColor = RocketChat.settings.get(`${ service.key }-button_label_color`);
				data.loginStyle = RocketChat.settings.get(`${ service.key }-login_style`);
				data.buttonColor = RocketChat.settings.get(`${ service.key }-button_color`);
				data.tokenSentVia = RocketChat.settings.get(`${ service.key }-token_sent_via`);
				data.identityTokenSentVia = RocketChat.settings.get(`${ service.key }-identity_token_sent_via`);
				data.usernameField = RocketChat.settings.get(`${ service.key }-username_field`);
				data.mergeUsers = RocketChat.settings.get(`${ service.key }-merge_users`);
				new CustomOAuth(serviceName.toLowerCase(), {
					serverURL: data.serverURL,
					tokenPath: data.tokenPath,
					identityPath: data.identityPath,
					authorizePath: data.authorizePath,
					scope: data.scope,
					loginStyle: data.loginStyle,
					tokenSentVia: data.tokenSentVia,
					identityTokenSentVia: data.identityTokenSentVia,
					usernameField: data.usernameField,
					mergeUsers: data.mergeUsers
				});
			}
			if (serviceName === 'Facebook') {
				data.appId = data.clientId;
				delete data.clientId;
			}
			if (serviceName === 'Twitter') {
				data.consumerKey = data.clientId;
				delete data.clientId;
			}
			ServiceConfiguration.configurations.upsert({
				service: serviceName.toLowerCase()
			}, {
				$set: data
			});
		} else {
			ServiceConfiguration.configurations.remove({
				service: serviceName.toLowerCase()
			});
		}
	});
}

const OAuthServicesUpdate = _.debounce(Meteor.bindEnvironment(_OAuthServicesUpdate), 2000);

function OAuthServicesRemove(_id) {
	const serviceName = _id.replace('Accounts_OAuth_Custom-', '');
	return ServiceConfiguration.configurations.remove({
		service: serviceName.toLowerCase()
	});
}

RocketChat.settings.get(/^Accounts_OAuth_.+/, function() {
	return OAuthServicesUpdate(); // eslint-disable-line new-cap
});

RocketChat.settings.get(/^Accounts_OAuth_Custom-[a-z0-9_]+/, function(key, value) {
	if (!value) {
		return OAuthServicesRemove(key);// eslint-disable-line new-cap
	}
});
