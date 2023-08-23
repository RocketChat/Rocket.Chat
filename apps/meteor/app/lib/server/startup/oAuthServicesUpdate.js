import { Logger } from '@rocket.chat/logger';
import { ServiceConfiguration } from 'meteor/service-configuration';
import _ from 'underscore';

import { CustomOAuth } from '../../../custom-oauth/server/custom_oauth_server';
import { settings } from '../../../settings/server';
import { addOAuthService } from '../functions/addOAuthService';

const logger = new Logger('rocketchat:lib');

async function _OAuthServicesUpdate() {
	const services = settings.getByRegexp(/^(Accounts_OAuth_|Accounts_OAuth_Custom-)[a-z0-9_]+$/i);
	const filteredServices = services.filter(([, value]) => typeof value === 'boolean');
	for await (const [key, value] of filteredServices) {
		logger.debug({ oauth_updated: key });
		let serviceName = key.replace('Accounts_OAuth_', '');
		if (serviceName === 'Meteor') {
			serviceName = 'meteor-developer';
		}
		if (/Accounts_OAuth_Custom-/.test(key)) {
			serviceName = key.replace('Accounts_OAuth_Custom-', '');
		}

		if (value === true) {
			const data = {
				clientId: settings.get(`${key}_id`),
				secret: settings.get(`${key}_secret`),
			};

			if (/Accounts_OAuth_Custom-/.test(key)) {
				data.custom = true;
				data.clientId = settings.get(`${key}-id`);
				data.secret = settings.get(`${key}-secret`);
				data.serverURL = settings.get(`${key}-url`);
				data.tokenPath = settings.get(`${key}-token_path`);
				data.identityPath = settings.get(`${key}-identity_path`);
				data.authorizePath = settings.get(`${key}-authorize_path`);
				data.scope = settings.get(`${key}-scope`);
				data.accessTokenParam = settings.get(`${key}-access_token_param`);
				data.buttonLabelText = settings.get(`${key}-button_label_text`);
				data.buttonLabelColor = settings.get(`${key}-button_label_color`);
				data.loginStyle = settings.get(`${key}-login_style`);
				data.buttonColor = settings.get(`${key}-button_color`);
				data.tokenSentVia = settings.get(`${key}-token_sent_via`);
				data.identityTokenSentVia = settings.get(`${key}-identity_token_sent_via`);
				data.keyField = settings.get(`${key}-key_field`);
				data.usernameField = settings.get(`${key}-username_field`);
				data.emailField = settings.get(`${key}-email_field`);
				data.nameField = settings.get(`${key}-name_field`);
				data.avatarField = settings.get(`${key}-avatar_field`);
				data.rolesClaim = settings.get(`${key}-roles_claim`);
				data.groupsClaim = settings.get(`${key}-groups_claim`);
				data.channelsMap = settings.get(`${key}-groups_channel_map`);
				data.channelsAdmin = settings.get(`${key}-channels_admin`);
				data.mergeUsers = settings.get(`${key}-merge_users`);
				data.mergeUsersDistinctServices = settings.get(`${key}-merge_users_distinct_services`);
				data.mapChannels = settings.get(`${key}-map_channels`);
				data.mergeRoles = settings.get(`${key}-merge_roles`);
				data.rolesToSync = settings.get(`${key}-roles_to_sync`);
				data.showButton = settings.get(`${key}-show_button`);

				new CustomOAuth(serviceName.toLowerCase(), {
					serverURL: data.serverURL,
					tokenPath: data.tokenPath,
					identityPath: data.identityPath,
					authorizePath: data.authorizePath,
					scope: data.scope,
					loginStyle: data.loginStyle,
					tokenSentVia: data.tokenSentVia,
					identityTokenSentVia: data.identityTokenSentVia,
					keyField: data.keyField,
					usernameField: data.usernameField,
					emailField: data.emailField,
					nameField: data.nameField,
					avatarField: data.avatarField,
					rolesClaim: data.rolesClaim,
					groupsClaim: data.groupsClaim,
					mapChannels: data.mapChannels,
					channelsMap: data.channelsMap,
					channelsAdmin: data.channelsAdmin,
					mergeUsers: data.mergeUsers,
					mergeUsersDistinctServices: data.mergeUsersDistinctServices,
					mergeRoles: data.mergeRoles,
					rolesToSync: data.rolesToSync,
					accessTokenParam: data.accessTokenParam,
					showButton: data.showButton,
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

			if (serviceName === 'Linkedin') {
				data.clientConfig = {
					requestPermissions: ['r_liteprofile', 'r_emailaddress'],
				};
			}

			if (serviceName === 'Nextcloud') {
				data.buttonLabelText = settings.get('Accounts_OAuth_Nextcloud_button_label_text');
				data.buttonLabelColor = settings.get('Accounts_OAuth_Nextcloud_button_label_color');
				data.buttonColor = settings.get('Accounts_OAuth_Nextcloud_button_color');
			}

			// If there's no data other than the service name, then put the service name in the data object so the operation won't fail
			const keys = Object.keys(data).filter((key) => data[key] !== undefined);
			if (!keys.length) {
				data.service = serviceName.toLowerCase();
			}

			await ServiceConfiguration.configurations.upsertAsync(
				{
					service: serviceName.toLowerCase(),
				},
				{
					$set: data,
				},
			);
		} else {
			await ServiceConfiguration.configurations.removeAsync({
				service: serviceName.toLowerCase(),
			});
		}
	}
}

const OAuthServicesUpdate = _.debounce(_OAuthServicesUpdate, 2000);

async function OAuthServicesRemove(_id) {
	const serviceName = _id.replace('Accounts_OAuth_Custom-', '');
	return ServiceConfiguration.configurations.removeAsync({
		service: serviceName.toLowerCase(),
	});
}

settings.watchByRegex(/^Accounts_OAuth_.+/, () => {
	return OAuthServicesUpdate(); // eslint-disable-line new-cap
});

settings.watchByRegex(/^Accounts_OAuth_Custom-[a-z0-9_]+/, (key, value) => {
	if (!value) {
		return OAuthServicesRemove(key); // eslint-disable-line new-cap
	}
});

async function customOAuthServicesInit() {
	// Add settings for custom OAuth providers to the settings so they get
	// automatically added when they are defined in ENV variables
	for await (const key of Object.keys(process.env)) {
		if (/Accounts_OAuth_Custom_[a-zA-Z0-9_-]+$/.test(key)) {
			// Most all shells actually prohibit the usage of - in environment variables
			// So this will allow replacing - with _ and translate it back to the setting name
			let name = key.replace('Accounts_OAuth_Custom_', '');

			if (name.indexOf('_') > -1) {
				name = name.replace(name.substr(name.indexOf('_')), '');
			}

			const serviceKey = `Accounts_OAuth_Custom_${name}`;

			if (key === serviceKey) {
				const values = {
					enabled: process.env[`${serviceKey}`] === 'true',
					clientId: process.env[`${serviceKey}_id`],
					clientSecret: process.env[`${serviceKey}_secret`],
					serverURL: process.env[`${serviceKey}_url`],
					tokenPath: process.env[`${serviceKey}_token_path`],
					identityPath: process.env[`${serviceKey}_identity_path`],
					authorizePath: process.env[`${serviceKey}_authorize_path`],
					scope: process.env[`${serviceKey}_scope`],
					accessTokenParam: process.env[`${serviceKey}_access_token_param`],
					buttonLabelText: process.env[`${serviceKey}_button_label_text`],
					buttonLabelColor: process.env[`${serviceKey}_button_label_color`],
					loginStyle: process.env[`${serviceKey}_login_style`],
					buttonColor: process.env[`${serviceKey}_button_color`],
					tokenSentVia: process.env[`${serviceKey}_token_sent_via`],
					identityTokenSentVia: process.env[`${serviceKey}_identity_token_sent_via`],
					keyField: process.env[`${serviceKey}_key_field`],
					usernameField: process.env[`${serviceKey}_username_field`],
					nameField: process.env[`${serviceKey}_name_field`],
					emailField: process.env[`${serviceKey}_email_field`],
					rolesClaim: process.env[`${serviceKey}_roles_claim`],
					groupsClaim: process.env[`${serviceKey}_groups_claim`],
					channelsMap: process.env[`${serviceKey}_groups_channel_map`],
					channelsAdmin: process.env[`${serviceKey}_channels_admin`],
					mergeUsers: process.env[`${serviceKey}_merge_users`] === 'true',
					mergeUsersDistinctServices: process.env[`${serviceKey}_merge_users_distinct_services`] === 'true',
					mapChannels: process.env[`${serviceKey}_map_channels`],
					mergeRoles: process.env[`${serviceKey}_merge_roles`] === 'true',
					rolesToSync: process.env[`${serviceKey}_roles_to_sync`],
					showButton: process.env[`${serviceKey}_show_button`] === 'true',
					avatarField: process.env[`${serviceKey}_avatar_field`],
				};

				await addOAuthService(name, values);
			}
		}
	}
}

await customOAuthServicesInit();
