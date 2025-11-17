import { addOpenIDService } from './addOpenIDService';

export async function initOpenIDServices(): Promise<void> {
	// Add settings for OpenID Connect providers from ENV variables
	for await (const key of Object.keys(process.env)) {
		if (/Accounts_OpenID_[a-zA-Z0-9_-]+$/.test(key)) {
			let name = key.replace('Accounts_OpenID_', '');

			if (name.indexOf('_') > -1) {
				name = name.replace(name.substr(name.indexOf('_')), '');
			}

			const serviceKey = `Accounts_OpenID_${name}`;

			if (key === serviceKey) {
				const values = {
					enabled: process.env[`${serviceKey}`] === 'true',
					clientId: process.env[`${serviceKey}_id`],
					clientSecret: process.env[`${serviceKey}_secret`],
					serverURL: process.env[`${serviceKey}_url`],
					useDiscovery: process.env[`${serviceKey}_use_discovery`] !== 'false',
					discoveryEndpoint: process.env[`${serviceKey}_discovery_endpoint`],
					tokenPath: process.env[`${serviceKey}_token_path`],
					authorizePath: process.env[`${serviceKey}_authorize_path`],
					userinfoPath: process.env[`${serviceKey}_userinfo_path`],
					jwksUri: process.env[`${serviceKey}_jwks_uri`],
					endSessionEndpoint: process.env[`${serviceKey}_end_session_endpoint`],
					scope: process.env[`${serviceKey}_scope`],
					responseType: process.env[`${serviceKey}_response_type`],
					idTokenSigningAlg: process.env[`${serviceKey}_id_token_signing_alg`],
					claimsFromIdToken: process.env[`${serviceKey}_claims_from_id_token`] !== 'false',
					validateIdToken: process.env[`${serviceKey}_validate_id_token`] !== 'false',
					enableSLO: process.env[`${serviceKey}_enable_slo`] === 'true',
					postLogoutRedirectUri: process.env[`${serviceKey}_post_logout_redirect_uri`],
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
					avatarField: process.env[`${serviceKey}_avatar_field`],
					rolesClaim: process.env[`${serviceKey}_roles_claim`],
					groupsClaim: process.env[`${serviceKey}_groups_claim`],
					channelsMap: process.env[`${serviceKey}_groups_channel_map`],
					channelsAdmin: process.env[`${serviceKey}_channels_admin`],
					mergeUsers: process.env[`${serviceKey}_merge_users`] === 'true',
					mergeUsersDistinctServices: process.env[`${serviceKey}_merge_users_distinct_services`] === 'true',
					mapChannels: process.env[`${serviceKey}_map_channels`] === 'true',
					mergeRoles: process.env[`${serviceKey}_merge_roles`] === 'true',
					rolesToSync: process.env[`${serviceKey}_roles_to_sync`],
					showButton: process.env[`${serviceKey}_show_button`] !== 'false',
				};

				await addOpenIDService(name, values);
			}
		}
	}
}
