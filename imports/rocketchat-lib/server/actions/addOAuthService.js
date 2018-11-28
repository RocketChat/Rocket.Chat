import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';

export default {
	async addOAuthService(ctx) {
		const { uid, name } = ctx.params;

		if (await ctx.call('autorization.hasPermission', { uid, permission: 'add-oauth-service' }) !== true) {
			throw new Meteor.Error('error-action-not-allowed', 'Adding OAuth Services is not allowed', { method: 'addOAuthService', action: 'Adding_OAuth_Services' });
		}

		const oAuthName = s.capitalize(name.toLowerCase().replace(/[^a-z0-9_]/g, ''));

		RocketChat.settings.add(`Accounts_OAuth_Custom-${ oAuthName }`, false, { type: 'boolean', group: 'OAuth', section: `Custom OAuth: ${ oAuthName }`, i18nLabel: 'Accounts_OAuth_Custom_Enable', persistent: true });
		RocketChat.settings.add(`Accounts_OAuth_Custom-${ oAuthName }-url`, '', { type: 'string', group: 'OAuth', section: `Custom OAuth: ${ oAuthName }`, i18nLabel: 'URL', persistent: true });
		RocketChat.settings.add(`Accounts_OAuth_Custom-${ oAuthName }-token_path`, '/oauth/token', { type: 'string', group: 'OAuth', section: `Custom OAuth: ${ oAuthName }`, i18nLabel: 'Accounts_OAuth_Custom_Token_Path', persistent: true });
		RocketChat.settings.add(`Accounts_OAuth_Custom-${ oAuthName }-token_sent_via`, 'payload', { type: 'select', group: 'OAuth', section: `Custom OAuth: ${ oAuthName }`, i18nLabel: 'Accounts_OAuth_Custom_Token_Sent_Via', persistent: true, values: [{ key: 'header', i18nLabel: 'Header' }, { key: 'payload', i18nLabel: 'Payload' }] });
		RocketChat.settings.add(`Accounts_OAuth_Custom-${ oAuthName }-identity_token_sent_via`, 'default', { type: 'select', group: 'OAuth', section: `Custom OAuth: ${ oAuthName }`, i18nLabel: 'Accounts_OAuth_Custom_Identity_Token_Sent_Via', persistent: true, values: [{ key: 'default', i18nLabel: 'Same_As_Token_Sent_Via' }, { key: 'header', i18nLabel: 'Header' }, { key: 'payload', i18nLabel: 'Payload' }] });
		RocketChat.settings.add(`Accounts_OAuth_Custom-${ oAuthName }-identity_path`, '/me', { type: 'string', group: 'OAuth', section: `Custom OAuth: ${ oAuthName }`, i18nLabel: 'Accounts_OAuth_Custom_Identity_Path', persistent: true });
		RocketChat.settings.add(`Accounts_OAuth_Custom-${ oAuthName }-authorize_path`, '/oauth/authorize', { type: 'string', group: 'OAuth', section: `Custom OAuth: ${ oAuthName }`, i18nLabel: 'Accounts_OAuth_Custom_Authorize_Path', persistent: true });
		RocketChat.settings.add(`Accounts_OAuth_Custom-${ oAuthName }-scope`, 'openid', { type: 'string', group: 'OAuth', section: `Custom OAuth: ${ oAuthName }`, i18nLabel: 'Accounts_OAuth_Custom_Scope', persistent: true });
		RocketChat.settings.add(`Accounts_OAuth_Custom-${ oAuthName }-id`, '', { type: 'string', group: 'OAuth', section: `Custom OAuth: ${ oAuthName }`, i18nLabel: 'Accounts_OAuth_Custom_id', persistent: true });
		RocketChat.settings.add(`Accounts_OAuth_Custom-${ oAuthName }-secret`, '', { type: 'string', group: 'OAuth', section: `Custom OAuth: ${ oAuthName }`, i18nLabel: 'Accounts_OAuth_Custom_Secret', persistent: true });
		RocketChat.settings.add(`Accounts_OAuth_Custom-${ oAuthName }-login_style`, 'popup', { type: 'select', group: 'OAuth', section: `Custom OAuth: ${ oAuthName }`, i18nLabel: 'Accounts_OAuth_Custom_Login_Style', persistent: true, values: [{ key: 'redirect', i18nLabel: 'Redirect' }, { key: 'popup', i18nLabel: 'Popup' }, { key: '', i18nLabel: 'Default' }] });
		RocketChat.settings.add(`Accounts_OAuth_Custom-${ oAuthName }-button_label_text`, '', { type: 'string', group: 'OAuth', section: `Custom OAuth: ${ oAuthName }`, i18nLabel: 'Accounts_OAuth_Custom_Button_Label_Text', persistent: true });
		RocketChat.settings.add(`Accounts_OAuth_Custom-${ oAuthName }-button_label_color`, '#FFFFFF', { type: 'string', group: 'OAuth', section: `Custom OAuth: ${ oAuthName }`, i18nLabel: 'Accounts_OAuth_Custom_Button_Label_Color', persistent: true });
		RocketChat.settings.add(`Accounts_OAuth_Custom-${ oAuthName }-button_color`, '#13679A', { type: 'string', group: 'OAuth', section: `Custom OAuth: ${ oAuthName }`, i18nLabel: 'Accounts_OAuth_Custom_Button_Color', persistent: true });
		RocketChat.settings.add(`Accounts_OAuth_Custom-${ oAuthName }-username_field`, '', { type: 'string', group: 'OAuth', section: `Custom OAuth: ${ oAuthName }`, i18nLabel: 'Accounts_OAuth_Custom_Username_Field', persistent: true });
		RocketChat.settings.add(`Accounts_OAuth_Custom-${ oAuthName }-merge_users`, false, { type: 'boolean', group: 'OAuth', section: `Custom OAuth: ${ oAuthName }`, i18nLabel: 'Accounts_OAuth_Custom_Merge_Users', persistent: true });
	},
};
