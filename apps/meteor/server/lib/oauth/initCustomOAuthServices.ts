import { addOAuthService } from './addOAuthService';

export async function initCustomOAuthServices(): Promise<void> {
	console.log('DEBUGOAUTH', 'initCustomOAuthServices');

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
