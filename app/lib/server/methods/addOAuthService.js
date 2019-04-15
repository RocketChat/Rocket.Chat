/* eslint no-multi-spaces: 0 */
/* eslint comma-spacing: 0 */
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { settings } from '../../../settings';
import { hasPermission } from '../../../authorization';
import s from 'underscore.string';

Meteor.methods({
	addOAuthService(name) {

		check(name, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'addOAuthService' });
		}

		if (hasPermission(Meteor.userId(), 'add-oauth-service') !== true) {
			throw new Meteor.Error('error-action-not-allowed', 'Adding OAuth Services is not allowed', { method: 'addOAuthService', action: 'Adding_OAuth_Services' });
		}

		name = name.toLowerCase().replace(/[^a-z0-9_]/g, '');
		name = s.capitalize(name);
		settings.add(`Accounts_OAuth_Custom-${ name }`                        , false             , { type: 'boolean', group: 'OAuth', section: `Custom OAuth: ${ name }`, i18nLabel: 'Accounts_OAuth_Custom_Enable', persistent: true });
		settings.add(`Accounts_OAuth_Custom-${ name }-url`                    , ''                , { type: 'string' , group: 'OAuth', section: `Custom OAuth: ${ name }`, i18nLabel: 'URL', persistent: true });
		settings.add(`Accounts_OAuth_Custom-${ name }-token_path`             , '/oauth/token'    , { type: 'string' , group: 'OAuth', section: `Custom OAuth: ${ name }`, i18nLabel: 'Accounts_OAuth_Custom_Token_Path', persistent: true });
		settings.add(`Accounts_OAuth_Custom-${ name }-token_sent_via`         , 'payload'         , { type: 'select' , group: 'OAuth', section: `Custom OAuth: ${ name }`, i18nLabel: 'Accounts_OAuth_Custom_Token_Sent_Via', persistent: true, values: [{ key: 'header', i18nLabel: 'Header' }, { key: 'payload', i18nLabel: 'Payload' }] });
		settings.add(`Accounts_OAuth_Custom-${ name }-identity_token_sent_via`, 'default'         , { type: 'select' , group: 'OAuth', section: `Custom OAuth: ${ name }`, i18nLabel: 'Accounts_OAuth_Custom_Identity_Token_Sent_Via', persistent: true, values: [{ key: 'default', i18nLabel: 'Same_As_Token_Sent_Via' }, { key: 'header', i18nLabel: 'Header' }, { key: 'payload', i18nLabel: 'Payload' }] });
		settings.add(`Accounts_OAuth_Custom-${ name }-identity_path`          , '/me'             , { type: 'string' , group: 'OAuth', section: `Custom OAuth: ${ name }`, i18nLabel: 'Accounts_OAuth_Custom_Identity_Path', persistent: true });
		settings.add(`Accounts_OAuth_Custom-${ name }-authorize_path`         , '/oauth/authorize', { type: 'string' , group: 'OAuth', section: `Custom OAuth: ${ name }`, i18nLabel: 'Accounts_OAuth_Custom_Authorize_Path', persistent: true });
		settings.add(`Accounts_OAuth_Custom-${ name }-scope`                  , 'openid'          , { type: 'string' , group: 'OAuth', section: `Custom OAuth: ${ name }`, i18nLabel: 'Accounts_OAuth_Custom_Scope', persistent: true });
		settings.add(`Accounts_OAuth_Custom-${ name }-access_token_param`     , 'access_token'    , { type: 'string' , group: 'OAuth', section: `Custom OAuth: ${ name }`, i18nLabel: 'Accounts_OAuth_Custom_Access_Token_Param', persistent: true });
		settings.add(`Accounts_OAuth_Custom-${ name }-id`                     , ''                , { type: 'string' , group: 'OAuth', section: `Custom OAuth: ${ name }`, i18nLabel: 'Accounts_OAuth_Custom_id', persistent: true });
		settings.add(`Accounts_OAuth_Custom-${ name }-secret`                 , ''                , { type: 'string' , group: 'OAuth', section: `Custom OAuth: ${ name }`, i18nLabel: 'Accounts_OAuth_Custom_Secret', persistent: true });
		settings.add(`Accounts_OAuth_Custom-${ name }-login_style`            , 'popup'           , { type: 'select' , group: 'OAuth', section: `Custom OAuth: ${ name }`, i18nLabel: 'Accounts_OAuth_Custom_Login_Style', persistent: true, values: [{ key: 'redirect', i18nLabel: 'Redirect' }, { key: 'popup', i18nLabel: 'Popup' }, { key: '', i18nLabel: 'Default' }] });
		settings.add(`Accounts_OAuth_Custom-${ name }-button_label_text`      , ''                , { type: 'string' , group: 'OAuth', section: `Custom OAuth: ${ name }`, i18nLabel: 'Accounts_OAuth_Custom_Button_Label_Text', persistent: true });
		settings.add(`Accounts_OAuth_Custom-${ name }-button_label_color`     , '#FFFFFF'         , { type: 'string' , group: 'OAuth', section: `Custom OAuth: ${ name }`, i18nLabel: 'Accounts_OAuth_Custom_Button_Label_Color', persistent: true });
		settings.add(`Accounts_OAuth_Custom-${ name }-button_color`           , '#1d74f5'         , { type: 'string' , group: 'OAuth', section: `Custom OAuth: ${ name }`, i18nLabel: 'Accounts_OAuth_Custom_Button_Color', persistent: true });
		settings.add(`Accounts_OAuth_Custom-${ name }-username_field`         , ''                , { type: 'string' , group: 'OAuth', section: `Custom OAuth: ${ name }`, i18nLabel: 'Accounts_OAuth_Custom_Username_Field', persistent: true });
		settings.add(`Accounts_OAuth_Custom-${ name }-roles_claim`            , 'roles'           , { type: 'string' , group: 'OAuth', section: `Custom OAuth: ${ name }`, i18nLabel: 'Accounts_OAuth_Custom_Roles_Claim', persistent: true });
		settings.add(`Accounts_OAuth_Custom-${ name }-merge_roles`	      , false             , { type: 'boolean', group: 'OAuth', section: `Custom OAuth: ${ name }`, i18nLabel: 'Accounts_OAuth_Custom_Merge_Roles', persistent: true });
		settings.add(`Accounts_OAuth_Custom-${ name }-merge_users`            , false             , { type: 'boolean', group: 'OAuth', section: `Custom OAuth: ${ name }`, i18nLabel: 'Accounts_OAuth_Custom_Merge_Users', persistent: true });
	} });
