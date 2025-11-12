import { capitalize } from '@rocket.chat/string-helpers';

import { settingsRegistry } from '../../../app/settings/server';

export async function addOpenIDService(name: string, values: { [k: string]: string | boolean | undefined } = {}): Promise<void> {
	name = name.toLowerCase().replace(/[^a-z0-9_]/g, '');
	name = capitalize(name);

	await settingsRegistry.add(`Accounts_OpenID-${name}`, values.enabled || false, {
		type: 'boolean',
		group: 'OAuth',
		section: `OpenID Connect: ${name}`,
		i18nLabel: 'Accounts_OpenID_Enable',
		persistent: true,
	});

	await settingsRegistry.add(`Accounts_OpenID-${name}-url`, values.serverURL || '', {
		type: 'string',
		group: 'OAuth',
		section: `OpenID Connect: ${name}`,
		i18nLabel: 'URL',
		i18nDescription: 'Accounts_OpenID_URL_Description',
		persistent: true,
	});

	await settingsRegistry.add(`Accounts_OpenID-${name}-use_discovery`, values.useDiscovery !== false, {
		type: 'boolean',
		group: 'OAuth',
		section: `OpenID Connect: ${name}`,
		i18nLabel: 'Accounts_OpenID_Use_Discovery',
		i18nDescription: 'Accounts_OpenID_Use_Discovery_Description',
		persistent: true,
	});

	await settingsRegistry.add(`Accounts_OpenID-${name}-discovery_endpoint`, values.discoveryEndpoint || '', {
		type: 'string',
		group: 'OAuth',
		section: `OpenID Connect: ${name}`,
		i18nLabel: 'Accounts_OpenID_Discovery_Endpoint',
		i18nDescription: 'Accounts_OpenID_Discovery_Endpoint_Description',
		persistent: true,
		enableQuery: {
			_id: `Accounts_OpenID-${name}-use_discovery`,
			value: true,
		},
	});

	await settingsRegistry.add(`Accounts_OpenID-${name}-authorize_path`, values.authorizePath || '/oauth/authorize', {
		type: 'string',
		group: 'OAuth',
		section: `OpenID Connect: ${name}`,
		i18nLabel: 'Accounts_OAuth_Custom_Authorize_Path',
		persistent: true,
		enableQuery: {
			_id: `Accounts_OpenID-${name}-use_discovery`,
			value: false,
		},
	});

	await settingsRegistry.add(`Accounts_OpenID-${name}-token_path`, values.tokenPath || '/oauth/token', {
		type: 'string',
		group: 'OAuth',
		section: `OpenID Connect: ${name}`,
		i18nLabel: 'Accounts_OAuth_Custom_Token_Path',
		persistent: true,
		enableQuery: {
			_id: `Accounts_OpenID-${name}-use_discovery`,
			value: false,
		},
	});

	await settingsRegistry.add(`Accounts_OpenID-${name}-userinfo_path`, values.userinfoPath || '/oauth/userinfo', {
		type: 'string',
		group: 'OAuth',
		section: `OpenID Connect: ${name}`,
		i18nLabel: 'Accounts_OpenID_Userinfo_Path',
		persistent: true,
		enableQuery: {
			_id: `Accounts_OpenID-${name}-use_discovery`,
			value: false,
		},
	});

	await settingsRegistry.add(`Accounts_OpenID-${name}-jwks_uri`, values.jwksUri || '', {
		type: 'string',
		group: 'OAuth',
		section: `OpenID Connect: ${name}`,
		i18nLabel: 'Accounts_OpenID_JWKS_URI',
		persistent: true,
		enableQuery: {
			_id: `Accounts_OpenID-${name}-use_discovery`,
			value: false,
		},
	});

	await settingsRegistry.add(`Accounts_OpenID-${name}-end_session_endpoint`, values.endSessionEndpoint || '', {
		type: 'string',
		group: 'OAuth',
		section: `OpenID Connect: ${name}`,
		i18nLabel: 'Accounts_OpenID_End_Session_Endpoint',
		i18nDescription: 'Accounts_OpenID_End_Session_Endpoint_Description',
		persistent: true,
		enableQuery: {
			_id: `Accounts_OpenID-${name}-use_discovery`,
			value: false,
		},
	});

	await settingsRegistry.add(`Accounts_OpenID-${name}-token_sent_via`, values.tokenSentVia || 'payload', {
		type: 'select',
		group: 'OAuth',
		section: `OpenID Connect: ${name}`,
		i18nLabel: 'Accounts_OAuth_Custom_Token_Sent_Via',
		persistent: true,
		values: [
			{ key: 'header', i18nLabel: 'Header' },
			{ key: 'payload', i18nLabel: 'Payload' },
		],
	});

	await settingsRegistry.add(`Accounts_OpenID-${name}-identity_token_sent_via`, values.identityTokenSentVia || 'default', {
		type: 'select',
		group: 'OAuth',
		section: `OpenID Connect: ${name}`,
		i18nLabel: 'Accounts_OAuth_Custom_Identity_Token_Sent_Via',
		persistent: true,
		values: [
			{ key: 'default', i18nLabel: 'Same_As_Token_Sent_Via' },
			{ key: 'header', i18nLabel: 'Header' },
			{ key: 'payload', i18nLabel: 'Payload' },
		],
	});

	await settingsRegistry.add(`Accounts_OpenID-${name}-scope`, values.scope || 'openid profile email', {
		type: 'string',
		group: 'OAuth',
		section: `OpenID Connect: ${name}`,
		i18nLabel: 'Accounts_OAuth_Custom_Scope',
		i18nDescription: 'Accounts_OpenID_Scope_Description',
		persistent: true,
	});

	await settingsRegistry.add(`Accounts_OpenID-${name}-response_type`, values.responseType || 'code', {
		type: 'select',
		group: 'OAuth',
		section: `OpenID Connect: ${name}`,
		i18nLabel: 'Accounts_OpenID_Response_Type',
		persistent: true,
		values: [
			{ key: 'code', i18nLabel: 'Code' },
			{ key: 'id_token', i18nLabel: 'ID Token' },
			{ key: 'id_token token', i18nLabel: 'ID Token + Token' },
			{ key: 'code id_token', i18nLabel: 'Code + ID Token' },
			{ key: 'code token', i18nLabel: 'Code + Token' },
			{ key: 'code id_token token', i18nLabel: 'Code + ID Token + Token' },
		],
	});

	await settingsRegistry.add(`Accounts_OpenID-${name}-id_token_signing_alg`, values.idTokenSigningAlg || 'RS256', {
		type: 'select',
		group: 'OAuth',
		section: `OpenID Connect: ${name}`,
		i18nLabel: 'Accounts_OpenID_ID_Token_Signing_Alg',
		persistent: true,
		values: [
			{ key: 'RS256', i18nLabel: 'RS256' },
			{ key: 'RS384', i18nLabel: 'RS384' },
			{ key: 'RS512', i18nLabel: 'RS512' },
			{ key: 'HS256', i18nLabel: 'HS256' },
			{ key: 'HS384', i18nLabel: 'HS384' },
			{ key: 'HS512', i18nLabel: 'HS512' },
			{ key: 'ES256', i18nLabel: 'ES256' },
			{ key: 'ES384', i18nLabel: 'ES384' },
			{ key: 'ES512', i18nLabel: 'ES512' },
		],
	});

	await settingsRegistry.add(`Accounts_OpenID-${name}-claims_from_id_token`, values.claimsFromIdToken !== false, {
		type: 'boolean',
		group: 'OAuth',
		section: `OpenID Connect: ${name}`,
		i18nLabel: 'Accounts_OpenID_Claims_From_ID_Token',
		i18nDescription: 'Accounts_OpenID_Claims_From_ID_Token_Description',
		persistent: true,
	});

	await settingsRegistry.add(`Accounts_OpenID-${name}-validate_id_token`, values.validateIdToken !== false, {
		type: 'boolean',
		group: 'OAuth',
		section: `OpenID Connect: ${name}`,
		i18nLabel: 'Accounts_OpenID_Validate_ID_Token',
		i18nDescription: 'Accounts_OpenID_Validate_ID_Token_Description',
		persistent: true,
	});

	await settingsRegistry.add(`Accounts_OpenID-${name}-enable_slo`, values.enableSLO || false, {
		type: 'boolean',
		group: 'OAuth',
		section: `OpenID Connect: ${name}`,
		i18nLabel: 'Accounts_OpenID_Enable_SLO',
		i18nDescription: 'Accounts_OpenID_Enable_SLO_Description',
		persistent: true,
	});

	await settingsRegistry.add(`Accounts_OpenID-${name}-post_logout_redirect_uri`, values.postLogoutRedirectUri || '', {
		type: 'string',
		group: 'OAuth',
		section: `OpenID Connect: ${name}`,
		i18nLabel: 'Accounts_OpenID_Post_Logout_Redirect_URI',
		persistent: true,
		enableQuery: {
			_id: `Accounts_OpenID-${name}-enable_slo`,
			value: true,
		},
	});

	await settingsRegistry.add(`Accounts_OpenID-${name}-id`, values.clientId || '', {
		type: 'string',
		group: 'OAuth',
		section: `OpenID Connect: ${name}`,
		i18nLabel: 'Accounts_OAuth_Custom_id',
		persistent: true,
	});

	await settingsRegistry.add(`Accounts_OpenID-${name}-secret`, values.clientSecret || '', {
		type: 'string',
		group: 'OAuth',
		section: `OpenID Connect: ${name}`,
		i18nLabel: 'Accounts_OAuth_Custom_Secret',
		persistent: true,
		secret: true,
	});

	await settingsRegistry.add(`Accounts_OpenID-${name}-login_style`, values.loginStyle || 'redirect', {
		type: 'select',
		group: 'OAuth',
		section: `OpenID Connect: ${name}`,
		i18nLabel: 'Accounts_OAuth_Custom_Login_Style',
		persistent: true,
		values: [
			{ key: 'redirect', i18nLabel: 'Redirect' },
			{ key: 'popup', i18nLabel: 'Popup' },
			{ key: '', i18nLabel: 'Default' },
		],
	});

	await settingsRegistry.add(`Accounts_OpenID-${name}-button_label_text`, values.buttonLabelText || '', {
		type: 'string',
		group: 'OAuth',
		section: `OpenID Connect: ${name}`,
		i18nLabel: 'Accounts_OAuth_Custom_Button_Label_Text',
		persistent: true,
	});

	await settingsRegistry.add(`Accounts_OpenID-${name}-button_label_color`, values.buttonLabelColor || '#FFFFFF', {
		type: 'string',
		group: 'OAuth',
		section: `OpenID Connect: ${name}`,
		i18nLabel: 'Accounts_OAuth_Custom_Button_Label_Color',
		persistent: true,
		alert: 'OAuth_button_colors_alert',
	});

	await settingsRegistry.add(`Accounts_OpenID-${name}-button_color`, values.buttonColor || '#1d74f5', {
		type: 'string',
		group: 'OAuth',
		section: `OpenID Connect: ${name}`,
		i18nLabel: 'Accounts_OAuth_Custom_Button_Color',
		persistent: true,
		alert: 'OAuth_button_colors_alert',
	});

	await settingsRegistry.add(`Accounts_OpenID-${name}-key_field`, values.keyField || 'email', {
		type: 'select',
		group: 'OAuth',
		section: `OpenID Connect: ${name}`,
		i18nLabel: 'Accounts_OAuth_Custom_Key_Field',
		persistent: true,
		values: [
			{ key: 'username', i18nLabel: 'Username' },
			{ key: 'email', i18nLabel: 'Email' },
		],
	});

	await settingsRegistry.add(`Accounts_OpenID-${name}-username_field`, values.usernameField || 'preferred_username', {
		type: 'string',
		group: 'OAuth',
		section: `OpenID Connect: ${name}`,
		i18nLabel: 'Accounts_OAuth_Custom_Username_Field',
		i18nDescription: 'Accounts_OpenID_Username_Field_Description',
		persistent: true,
	});

	await settingsRegistry.add(`Accounts_OpenID-${name}-email_field`, values.emailField || 'email', {
		type: 'string',
		group: 'OAuth',
		section: `OpenID Connect: ${name}`,
		i18nLabel: 'Accounts_OAuth_Custom_Email_Field',
		persistent: true,
	});

	await settingsRegistry.add(`Accounts_OpenID-${name}-name_field`, values.nameField || 'name', {
		type: 'string',
		group: 'OAuth',
		section: `OpenID Connect: ${name}`,
		i18nLabel: 'Accounts_OAuth_Custom_Name_Field',
		persistent: true,
	});

	await settingsRegistry.add(`Accounts_OpenID-${name}-avatar_field`, values.avatarField || 'picture', {
		type: 'string',
		group: 'OAuth',
		section: `OpenID Connect: ${name}`,
		i18nLabel: 'Accounts_OAuth_Custom_Avatar_Field',
		persistent: true,
	});

	await settingsRegistry.add(`Accounts_OpenID-${name}-roles_claim`, values.rolesClaim || 'roles', {
		type: 'string',
		group: 'OAuth',
		section: `OpenID Connect: ${name}`,
		i18nLabel: 'Accounts_OAuth_Custom_Roles_Claim',
		enterprise: true,
		invalidValue: 'roles',
		modules: ['oauth-enterprise'],
	});

	await settingsRegistry.add(`Accounts_OpenID-${name}-groups_claim`, values.groupsClaim || 'groups', {
		type: 'string',
		group: 'OAuth',
		section: `OpenID Connect: ${name}`,
		i18nLabel: 'Accounts_OAuth_Custom_Groups_Claim',
		enterprise: true,
		invalidValue: 'groups',
		modules: ['oauth-enterprise'],
	});

	await settingsRegistry.add(`Accounts_OpenID-${name}-channels_admin`, values.channelsAdmin || 'rocket.cat', {
		type: 'string',
		group: 'OAuth',
		section: `OpenID Connect: ${name}`,
		i18nLabel: 'Accounts_OAuth_Custom_Channel_Admin',
		persistent: true,
	});

	await settingsRegistry.add(`Accounts_OpenID-${name}-map_channels`, values.mapChannels || false, {
		type: 'boolean',
		group: 'OAuth',
		section: `OpenID Connect: ${name}`,
		i18nLabel: 'Accounts_OAuth_Custom_Map_Channels',
		enterprise: true,
		invalidValue: false,
		modules: ['oauth-enterprise'],
	});

	await settingsRegistry.add(`Accounts_OpenID-${name}-merge_roles`, values.mergeRoles || false, {
		type: 'boolean',
		group: 'OAuth',
		section: `OpenID Connect: ${name}`,
		i18nLabel: 'Accounts_OAuth_Custom_Merge_Roles',
		enterprise: true,
		invalidValue: false,
		modules: ['oauth-enterprise'],
	});

	await settingsRegistry.add(`Accounts_OpenID-${name}-roles_to_sync`, values.rolesToSync || '', {
		type: 'string',
		group: 'OAuth',
		section: `OpenID Connect: ${name}`,
		i18nLabel: 'Accounts_OAuth_Custom_Roles_To_Sync',
		i18nDescription: 'Accounts_OAuth_Custom_Roles_To_Sync_Description',
		enterprise: true,
		enableQuery: {
			_id: `Accounts_OpenID-${name}-merge_roles`,
			value: true,
		},
		invalidValue: '',
		modules: ['oauth-enterprise'],
	});

	await settingsRegistry.add(`Accounts_OpenID-${name}-merge_users`, values.mergeUsers || false, {
		type: 'boolean',
		group: 'OAuth',
		section: `OpenID Connect: ${name}`,
		i18nLabel: 'Accounts_OAuth_Custom_Merge_Users',
		persistent: true,
	});

	await settingsRegistry.add(`Accounts_OpenID-${name}-merge_users_distinct_services`, values.mergeUsersDistinctServices || false, {
		type: 'boolean',
		group: 'OAuth',
		section: `OpenID Connect: ${name}`,
		i18nLabel: 'Accounts_OAuth_Custom_Merge_Users_Distinct_Services',
		i18nDescription: 'Accounts_OAuth_Custom_Merge_Users_Distinct_Services_Description',
		enableQuery: {
			_id: `Accounts_OpenID-${name}-merge_users`,
			value: true,
		},
		persistent: true,
	});

	await settingsRegistry.add(`Accounts_OpenID-${name}-show_button`, values.showButton !== false, {
		type: 'boolean',
		group: 'OAuth',
		section: `OpenID Connect: ${name}`,
		i18nLabel: 'Accounts_OAuth_Custom_Show_Button_On_Login_Page',
		persistent: true,
	});

	await settingsRegistry.add(
		`Accounts_OpenID-${name}-groups_channel_map`,
		values.channelsMap || '{\n\t"rocket-admin": "admin",\n\t"tech-support": "support"\n}',
		{
			type: 'code',
			multiline: true,
			code: 'application/json',
			group: 'OAuth',
			section: `OpenID Connect: ${name}`,
			i18nLabel: 'Accounts_OAuth_Custom_Channel_Map',
			persistent: true,
		},
	);
}
