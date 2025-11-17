import type { ILoginServiceConfiguration, OAuthConfiguration } from '@rocket.chat/core-typings';
import { LoginServiceConfiguration } from '@rocket.chat/models';

import { logger } from './logger';
import { OpenIDConnect } from './OpenIDConnect';
import {
	notifyOnLoginServiceConfigurationChanged,
	notifyOnLoginServiceConfigurationChangedByService,
} from '../../../app/lib/server/lib/notifyListener';
import { settings } from '../../../app/settings/server/cached';

export async function updateOpenIDServices(): Promise<void> {
	const services = settings.getByRegexp(/^Accounts_OpenID-[a-z0-9_]+$/i);
	const filteredServices = services.filter(([, value]) => typeof value === 'boolean');

	for await (const [key, value] of filteredServices) {
		logger.debug({ openid_updated: key });
		const serviceName = key.replace('Accounts_OpenID-', '');
		const serviceKey = serviceName.toLowerCase();

		if (value === true) {
			const data: Partial<ILoginServiceConfiguration & Omit<OAuthConfiguration, '_id'>> = {
				clientId: settings.get(`${key}-id`),
				secret: settings.get(`${key}-secret`),
				custom: true,
				_OpenIDConnect: true,
				serverURL: settings.get(`${key}-url`),
				useDiscovery: settings.get(`${key}-use_discovery`),
				discoveryEndpoint: settings.get(`${key}-discovery_endpoint`),
				tokenPath: settings.get(`${key}-token_path`),
				authorizePath: settings.get(`${key}-authorize_path`),
				userinfoPath: settings.get(`${key}-userinfo_path`),
				jwksUri: settings.get(`${key}-jwks_uri`),
				endSessionEndpoint: settings.get(`${key}-end_session_endpoint`),
				scope: settings.get(`${key}-scope`),
				responseType: settings.get(`${key}-response_type`),
				idTokenSigningAlg: settings.get(`${key}-id_token_signing_alg`),
				claimsFromIdToken: settings.get(`${key}-claims_from_id_token`),
				validateIdToken: settings.get(`${key}-validate_id_token`),
				enableSLO: settings.get(`${key}-enable_slo`),
				postLogoutRedirectUri: settings.get(`${key}-post_logout_redirect_uri`),
				buttonLabelText: settings.get(`${key}-button_label_text`),
				buttonLabelColor: settings.get(`${key}-button_label_color`),
				loginStyle: settings.get(`${key}-login_style`),
				buttonColor: settings.get(`${key}-button_color`),
				tokenSentVia: settings.get(`${key}-token_sent_via`),
				identityTokenSentVia: settings.get(`${key}-identity_token_sent_via`),
				keyField: settings.get(`${key}-key_field`),
				usernameField: settings.get(`${key}-username_field`),
				emailField: settings.get(`${key}-email_field`),
				nameField: settings.get(`${key}-name_field`),
				avatarField: settings.get(`${key}-avatar_field`),
				rolesClaim: settings.get(`${key}-roles_claim`),
				groupsClaim: settings.get(`${key}-groups_claim`),
				channelsMap: settings.get(`${key}-groups_channel_map`),
				channelsAdmin: settings.get(`${key}-channels_admin`),
				mergeUsers: settings.get(`${key}-merge_users`),
				mergeUsersDistinctServices: settings.get(`${key}-merge_users_distinct_services`),
				mapChannels: settings.get(`${key}-map_channels`),
				mergeRoles: settings.get(`${key}-merge_roles`),
				rolesToSync: settings.get(`${key}-roles_to_sync`),
				showButton: settings.get(`${key}-show_button`),
			};

			// Initialize OpenID Connect service
			new OpenIDConnect(serviceKey, {
				serverURL: data.serverURL as string,
				useDiscovery: data.useDiscovery as boolean,
				discoveryEndpoint: data.discoveryEndpoint as string,
				tokenPath: data.tokenPath as string,
				authorizePath: data.authorizePath as string,
				userinfoPath: data.userinfoPath as string,
				jwksUri: data.jwksUri as string,
				endSessionEndpoint: data.endSessionEndpoint as string,
				scope: data.scope as string,
				responseType: data.responseType as string,
				idTokenSigningAlg: data.idTokenSigningAlg as string,
				claimsFromIdToken: data.claimsFromIdToken as boolean,
				validateIdToken: data.validateIdToken as boolean,
				enableSLO: data.enableSLO as boolean,
				postLogoutRedirectUri: data.postLogoutRedirectUri as string,
				loginStyle: data.loginStyle as 'redirect' | 'popup' | '',
				tokenSentVia: data.tokenSentVia as 'header' | 'payload',
				identityTokenSentVia: data.identityTokenSentVia as 'header' | 'payload' | 'default',
				keyField: data.keyField as 'username' | 'email',
				usernameField: data.usernameField as string,
				emailField: data.emailField as string,
				nameField: data.nameField as string,
				avatarField: data.avatarField as string,
				rolesClaim: data.rolesClaim as string,
				groupsClaim: data.groupsClaim as string,
				mapChannels: data.mapChannels as boolean,
				channelsMap: data.channelsMap as string,
				channelsAdmin: data.channelsAdmin as string,
				mergeUsers: data.mergeUsers as boolean,
				mergeUsersDistinctServices: data.mergeUsersDistinctServices as boolean,
				mergeRoles: data.mergeRoles as boolean,
				rolesToSync: data.rolesToSync as string,
				accessTokenParam: 'access_token',
				showButton: data.showButton as boolean,
				buttonLabelText: data.buttonLabelText as string,
				buttonLabelColor: data.buttonLabelColor as string,
				buttonColor: data.buttonColor as string,
			});

			await LoginServiceConfiguration.createOrUpdateService(serviceKey, data);
			void notifyOnLoginServiceConfigurationChangedByService(serviceKey);
		} else {
			const service = await LoginServiceConfiguration.findOneByService(serviceName, { projection: { _id: 1 } });
			if (service?._id) {
				const { deletedCount } = await LoginServiceConfiguration.removeService(service._id);
				if (deletedCount > 0) {
					void notifyOnLoginServiceConfigurationChanged({ _id: service._id }, 'removed');
				}
			}
		}
	}
}
