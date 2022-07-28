/* eslint no-multi-spaces: 0 */
/* eslint comma-spacing: 0 */
import { capitalize } from '@rocket.chat/string-helpers';

import { settingsRegistry } from '../../../settings/server';

export function addOAuthService(name: string, values: { [k: string]: string | boolean | undefined } = {}): void {
	name = name.toLowerCase().replace(/[^a-z0-9_]/g, '');
	name = capitalize(name);
	settingsRegistry.add(`Accounts_OAuth_Custom-${name}`, values.enabled || false, {
		type: 'boolean',
		group: 'OAuth',
		section: `Custom OAuth: ${name}`,
		i18nLabel: 'Accounts_OAuth_Custom_Enable',
		persistent: true,
	});
	settingsRegistry.add(`Accounts_OAuth_Custom-${name}-url`, values.serverURL || '', {
		type: 'string',
		group: 'OAuth',
		section: `Custom OAuth: ${name}`,
		i18nLabel: 'URL',
		persistent: true,
	});
	settingsRegistry.add(`Accounts_OAuth_Custom-${name}-token_path`, values.tokenPath || '/oauth/token', {
		type: 'string',
		group: 'OAuth',
		section: `Custom OAuth: ${name}`,
		i18nLabel: 'Accounts_OAuth_Custom_Token_Path',
		persistent: true,
	});
	settingsRegistry.add(`Accounts_OAuth_Custom-${name}-token_sent_via`, values.tokenSentVia || 'payload', {
		type: 'select',
		group: 'OAuth',
		section: `Custom OAuth: ${name}`,
		i18nLabel: 'Accounts_OAuth_Custom_Token_Sent_Via',
		persistent: true,
		values: [
			{ key: 'header', i18nLabel: 'Header' },
			{ key: 'payload', i18nLabel: 'Payload' },
		],
	});
	settingsRegistry.add(`Accounts_OAuth_Custom-${name}-identity_token_sent_via`, values.identityTokenSentVia || 'default', {
		type: 'select',
		group: 'OAuth',
		section: `Custom OAuth: ${name}`,
		i18nLabel: 'Accounts_OAuth_Custom_Identity_Token_Sent_Via',
		persistent: true,
		values: [
			{ key: 'default', i18nLabel: 'Same_As_Token_Sent_Via' },
			{ key: 'header', i18nLabel: 'Header' },
			{ key: 'payload', i18nLabel: 'Payload' },
		],
	});
	settingsRegistry.add(`Accounts_OAuth_Custom-${name}-identity_path`, values.identityPath || '/me', {
		type: 'string',
		group: 'OAuth',
		section: `Custom OAuth: ${name}`,
		i18nLabel: 'Accounts_OAuth_Custom_Identity_Path',
		persistent: true,
	});
	settingsRegistry.add(`Accounts_OAuth_Custom-${name}-authorize_path`, values.authorizePath || '/oauth/authorize', {
		type: 'string',
		group: 'OAuth',
		section: `Custom OAuth: ${name}`,
		i18nLabel: 'Accounts_OAuth_Custom_Authorize_Path',
		persistent: true,
	});
	settingsRegistry.add(`Accounts_OAuth_Custom-${name}-scope`, values.scope || 'openid', {
		type: 'string',
		group: 'OAuth',
		section: `Custom OAuth: ${name}`,
		i18nLabel: 'Accounts_OAuth_Custom_Scope',
		persistent: true,
	});
	settingsRegistry.add(`Accounts_OAuth_Custom-${name}-access_token_param`, values.accessTokenParam || 'access_token', {
		type: 'string',
		group: 'OAuth',
		section: `Custom OAuth: ${name}`,
		i18nLabel: 'Accounts_OAuth_Custom_Access_Token_Param',
		persistent: true,
	});
	settingsRegistry.add(`Accounts_OAuth_Custom-${name}-id`, values.clientId || '', {
		type: 'string',
		group: 'OAuth',
		section: `Custom OAuth: ${name}`,
		i18nLabel: 'Accounts_OAuth_Custom_id',
		persistent: true,
	});
	settingsRegistry.add(`Accounts_OAuth_Custom-${name}-secret`, values.clientSecret || '', {
		type: 'string',
		group: 'OAuth',
		section: `Custom OAuth: ${name}`,
		i18nLabel: 'Accounts_OAuth_Custom_Secret',
		persistent: true,
	});
	settingsRegistry.add(`Accounts_OAuth_Custom-${name}-login_style`, values.loginStyle || 'popup', {
		type: 'select',
		group: 'OAuth',
		section: `Custom OAuth: ${name}`,
		i18nLabel: 'Accounts_OAuth_Custom_Login_Style',
		persistent: true,
		values: [
			{ key: 'redirect', i18nLabel: 'Redirect' },
			{ key: 'popup', i18nLabel: 'Popup' },
			{ key: '', i18nLabel: 'Default' },
		],
	});
	settingsRegistry.add(`Accounts_OAuth_Custom-${name}-button_label_text`, values.buttonLabelText || '', {
		type: 'string',
		group: 'OAuth',
		section: `Custom OAuth: ${name}`,
		i18nLabel: 'Accounts_OAuth_Custom_Button_Label_Text',
		persistent: true,
	});
	settingsRegistry.add(`Accounts_OAuth_Custom-${name}-button_label_color`, values.buttonLabelColor || '#FFFFFF', {
		type: 'string',
		group: 'OAuth',
		section: `Custom OAuth: ${name}`,
		i18nLabel: 'Accounts_OAuth_Custom_Button_Label_Color',
		persistent: true,
	});
	settingsRegistry.add(`Accounts_OAuth_Custom-${name}-button_color`, values.buttonColor || '#1d74f5', {
		type: 'string',
		group: 'OAuth',
		section: `Custom OAuth: ${name}`,
		i18nLabel: 'Accounts_OAuth_Custom_Button_Color',
		persistent: true,
	});
	settingsRegistry.add(`Accounts_OAuth_Custom-${name}-key_field`, values.keyField || 'username', {
		type: 'select',
		group: 'OAuth',
		section: `Custom OAuth: ${name}`,
		i18nLabel: 'Accounts_OAuth_Custom_Key_Field',
		persistent: true,
		values: [
			{ key: 'username', i18nLabel: 'Username' },
			{ key: 'email', i18nLabel: 'Email' },
		],
	});
	settingsRegistry.add(`Accounts_OAuth_Custom-${name}-username_field`, values.usernameField || '', {
		type: 'string',
		group: 'OAuth',
		section: `Custom OAuth: ${name}`,
		i18nLabel: 'Accounts_OAuth_Custom_Username_Field',
		persistent: true,
	});
	settingsRegistry.add(`Accounts_OAuth_Custom-${name}-email_field`, values.emailField || '', {
		type: 'string',
		group: 'OAuth',
		section: `Custom OAuth: ${name}`,
		i18nLabel: 'Accounts_OAuth_Custom_Email_Field',
		persistent: true,
	});
	settingsRegistry.add(`Accounts_OAuth_Custom-${name}-name_field`, values.nameField || '', {
		type: 'string',
		group: 'OAuth',
		section: `Custom OAuth: ${name}`,
		i18nLabel: 'Accounts_OAuth_Custom_Name_Field',
		persistent: true,
	});
	settingsRegistry.add(`Accounts_OAuth_Custom-${name}-avatar_field`, values.avatarField || '', {
		type: 'string',
		group: 'OAuth',
		section: `Custom OAuth: ${name}`,
		i18nLabel: 'Accounts_OAuth_Custom_Avatar_Field',
		persistent: true,
	});
	settingsRegistry.add(`Accounts_OAuth_Custom-${name}-roles_claim`, values.rolesClaim || 'roles', {
		type: 'string',
		group: 'OAuth',
		section: `Custom OAuth: ${name}`,
		i18nLabel: 'Accounts_OAuth_Custom_Roles_Claim',
		enterprise: true,
		invalidValue: 'roles',
		modules: ['oauth-enterprise'],
	});
	settingsRegistry.add(`Accounts_OAuth_Custom-${name}-groups_claim`, values.groupsClaim || 'groups', {
		type: 'string',
		group: 'OAuth',
		section: `Custom OAuth: ${name}`,
		i18nLabel: 'Accounts_OAuth_Custom_Groups_Claim',
		enterprise: true,
		invalidValue: 'groups',
		modules: ['oauth-enterprise'],
	});

	settingsRegistry.add(`Accounts_OAuth_Custom-${name}-channels_admin`, values.channelsAdmin || 'rocket.cat', {
		type: 'string',
		group: 'OAuth',
		section: `Custom OAuth: ${name}`,
		i18nLabel: 'Accounts_OAuth_Custom_Channel_Admin',
		persistent: true,
	});
	settingsRegistry.add(`Accounts_OAuth_Custom-${name}-map_channels`, values.mapChannels || false, {
		type: 'boolean',
		group: 'OAuth',
		section: `Custom OAuth: ${name}`,
		i18nLabel: 'Accounts_OAuth_Custom_Map_Channels',
		enterprise: true,
		invalidValue: false,
		modules: ['oauth-enterprise'],
	});
	settingsRegistry.add(`Accounts_OAuth_Custom-${name}-merge_roles`, values.mergeRoles || false, {
		type: 'boolean',
		group: 'OAuth',
		section: `Custom OAuth: ${name}`,
		i18nLabel: 'Accounts_OAuth_Custom_Merge_Roles',
		enterprise: true,
		invalidValue: false,
		modules: ['oauth-enterprise'],
	});
	settingsRegistry.add(`Accounts_OAuth_Custom-${name}-roles_to_sync`, values.rolesToSync || '', {
		type: 'string',
		group: 'OAuth',
		section: `Custom OAuth: ${name}`,
		i18nLabel: 'Accounts_OAuth_Custom_Roles_To_Sync',
		i18nDescription: 'Accounts_OAuth_Custom_Roles_To_Sync_Description',
		enterprise: true,
		enableQuery: {
			_id: `Accounts_OAuth_Custom-${name}-merge_roles`,
			value: true,
		},
		invalidValue: '',
		modules: ['oauth-enterprise'],
	});
	settingsRegistry.add(`Accounts_OAuth_Custom-${name}-merge_users`, values.mergeUsers || false, {
		type: 'boolean',
		group: 'OAuth',
		section: `Custom OAuth: ${name}`,
		i18nLabel: 'Accounts_OAuth_Custom_Merge_Users',
		persistent: true,
	});
	settingsRegistry.add(`Accounts_OAuth_Custom-${name}-show_button`, values.showButton || true, {
		type: 'boolean',
		group: 'OAuth',
		section: `Custom OAuth: ${name}`,
		i18nLabel: 'Accounts_OAuth_Custom_Show_Button_On_Login_Page',
		persistent: true,
	});
	settingsRegistry.add(
		`Accounts_OAuth_Custom-${name}-groups_channel_map`,
		values.channelsMap || '{\n\t"rocket-admin": "admin",\n\t"tech-support": "support"\n}',
		{
			type: 'code',
			multiline: true,
			code: 'application/json',
			group: 'OAuth',
			section: `Custom OAuth: ${name}`,
			i18nLabel: 'Accounts_OAuth_Custom_Channel_Map',
			persistent: true,
		},
	);
}
