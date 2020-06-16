import { Meteor } from 'meteor/meteor';

import { settings } from '../../../settings/server';
import {
	defaultAuthnContextTemplate,
	defaultAuthRequestTemplate,
	defaultLogoutResponseTemplate,
	defaultLogoutRequestTemplate,
	defaultNameIDTemplate,
	defaultIdentifierFormat,
	defaultAuthnContext,
	defaultMetadataTemplate,
	defaultMetadataCertificateTemplate,
} from '../lib/constants';


Meteor.methods({
	addSamlService(name) {
		settings.add(`SAML_Custom_${ name }`, false, {
			type: 'boolean',
			group: 'SAML',
			i18nLabel: 'Accounts_OAuth_Custom_Enable',
		});
		settings.add(`SAML_Custom_${ name }_provider`, 'provider-name', {
			type: 'string',
			group: 'SAML',
			i18nLabel: 'SAML_Custom_Provider',
		});
		settings.add(`SAML_Custom_${ name }_entry_point`, 'https://example.com/simplesaml/saml2/idp/SSOService.php', {
			type: 'string',
			group: 'SAML',
			i18nLabel: 'SAML_Custom_Entry_point',
		});
		settings.add(`SAML_Custom_${ name }_idp_slo_redirect_url`, 'https://example.com/simplesaml/saml2/idp/SingleLogoutService.php', {
			type: 'string',
			group: 'SAML',
			i18nLabel: 'SAML_Custom_IDP_SLO_Redirect_URL',
		});
		settings.add(`SAML_Custom_${ name }_issuer`, 'https://your-rocket-chat/_saml/metadata/provider-name', {
			type: 'string',
			group: 'SAML',
			i18nLabel: 'SAML_Custom_Issuer',
		});
		settings.add(`SAML_Custom_${ name }_debug`, false, {
			type: 'boolean',
			group: 'SAML',
			i18nLabel: 'SAML_Custom_Debug',
		});

		// UI Settings
		settings.add(`SAML_Custom_${ name }_button_label_text`, 'SAML', {
			type: 'string',
			group: 'SAML',
			section: 'SAML_Section_1_User_Interface',
			i18nLabel: 'Accounts_OAuth_Custom_Button_Label_Text',
		});
		settings.add(`SAML_Custom_${ name }_button_label_color`, '#FFFFFF', {
			type: 'string',
			group: 'SAML',
			section: 'SAML_Section_1_User_Interface',
			i18nLabel: 'Accounts_OAuth_Custom_Button_Label_Color',
		});
		settings.add(`SAML_Custom_${ name }_button_color`, '#1d74f5', {
			type: 'string',
			group: 'SAML',
			section: 'SAML_Section_1_User_Interface',
			i18nLabel: 'Accounts_OAuth_Custom_Button_Color',
		});

		// Certificate settings
		settings.add(`SAML_Custom_${ name }_cert`, '', {
			type: 'string',
			group: 'SAML',
			section: 'SAML_Section_2_Certificate',
			i18nLabel: 'SAML_Custom_Cert',
			multiline: true,
			secret: true,
		});
		settings.add(`SAML_Custom_${ name }_public_cert`, '', {
			type: 'string',
			group: 'SAML',
			section: 'SAML_Section_2_Certificate',
			multiline: true,
			i18nLabel: 'SAML_Custom_Public_Cert',
		});
		settings.add(`SAML_Custom_${ name }_signature_validation_type`, 'All', {
			type: 'select',
			values: [
				{ key: 'Response', i18nLabel: 'SAML_Custom_signature_validation_response' },
				{ key: 'Assertion', i18nLabel: 'SAML_Custom_signature_validation_assertion' },
				{ key: 'Either', i18nLabel: 'SAML_Custom_signature_validation_either' },
				{ key: 'All', i18nLabel: 'SAML_Custom_signature_validation_all' },
			],
			group: 'SAML',
			section: 'SAML_Section_2_Certificate',
			i18nLabel: 'SAML_Custom_signature_validation_type',
			i18nDescription: 'SAML_Custom_signature_validation_type_description',
		});
		settings.add(`SAML_Custom_${ name }_private_key`, '', {
			type: 'string',
			group: 'SAML',
			section: 'SAML_Section_2_Certificate',
			multiline: true,
			i18nLabel: 'SAML_Custom_Private_Key',
			secret: true,
		});

		// Settings to customize behavior
		settings.add(`SAML_Custom_${ name }_generate_username`, false, {
			type: 'boolean',
			group: 'SAML',
			section: 'SAML_Section_3_Behavior',
			i18nLabel: 'SAML_Custom_Generate_Username',
		});
		settings.add(`SAML_Custom_${ name }_username_normalize`, 'None', {
			type: 'select',
			values: [
				{ key: 'None', i18nLabel: 'SAML_Custom_Username_Normalize_None' },
				{ key: 'Lowercase', i18nLabel: 'SAML_Custom_Username_Normalize_Lowercase' },
			],
			group: 'SAML',
			section: 'SAML_Section_3_Behavior',
			i18nLabel: 'SAML_Custom_Username_Normalize',
		});
		settings.add(`SAML_Custom_${ name }_immutable_property`, 'EMail', {
			type: 'select',
			values: [
				{ key: 'Username', i18nLabel: 'SAML_Custom_Immutable_Property_Username' },
				{ key: 'EMail', i18nLabel: 'SAML_Custom_Immutable_Property_EMail' },
			],
			group: 'SAML',
			section: 'SAML_Section_3_Behavior',
			i18nLabel: 'SAML_Custom_Immutable_Property',
		});
		settings.add(`SAML_Custom_${ name }_name_overwrite`, false, {
			type: 'boolean',
			group: 'SAML',
			section: 'SAML_Section_3_Behavior',
			i18nLabel: 'SAML_Custom_name_overwrite',
		});
		settings.add(`SAML_Custom_${ name }_mail_overwrite`, false, {
			type: 'boolean',
			group: 'SAML',
			section: 'SAML_Section_3_Behavior',
			i18nLabel: 'SAML_Custom_mail_overwrite',
		});
		settings.add(`SAML_Custom_${ name }_logout_behaviour`, 'SAML', {
			type: 'select',
			values: [
				{ key: 'SAML', i18nLabel: 'SAML_Custom_Logout_Behaviour_Terminate_SAML_Session' },
				{ key: 'Local', i18nLabel: 'SAML_Custom_Logout_Behaviour_End_Only_RocketChat' },
			],
			group: 'SAML',
			section: 'SAML_Section_3_Behavior',
			i18nLabel: 'SAML_Custom_Logout_Behaviour',
		});

		// Roles Settings
		settings.add(`SAML_Custom_${ name }_default_user_role`, 'user', {
			type: 'string',
			group: 'SAML',
			section: 'SAML_Section_4_Roles',
			i18nLabel: 'SAML_Default_User_Role',
			i18nDescription: 'SAML_Default_User_Role_Description',
		});
		settings.add(`SAML_Custom_${ name }_role_attribute_name`, '', {
			type: 'string',
			group: 'SAML',
			section: 'SAML_Section_4_Roles',
			i18nLabel: 'SAML_Role_Attribute_Name',
			i18nDescription: 'SAML_Role_Attribute_Name_Description',
		});
		settings.add(`SAML_Custom_${ name }_role_attribute_sync`, false, {
			type: 'boolean',
			group: 'SAML',
			section: 'SAML_Section_4_Roles',
			i18nLabel: 'SAML_Role_Attribute_Sync',
			i18nDescription: 'SAML_Role_Attribute_Sync_Description',
		});


		// Data Mapping Settings
		settings.add(`SAML_Custom_${ name }_user_data_fieldmap`, '{"username":"username", "email":"email", "name": "cn"}', {
			type: 'string',
			group: 'SAML',
			section: 'SAML_Section_5_Mapping',
			i18nLabel: 'SAML_Custom_user_data_fieldmap',
			i18nDescription: 'SAML_Custom_user_data_fieldmap_description',
			multiline: true,
		});

		// Advanced settings
		settings.add(`SAML_Custom_${ name }_allowed_clock_drift`, 0, {
			type: 'int',
			group: 'SAML',
			section: 'SAML_Section_6_Advanced',
			i18nLabel: 'SAML_Allowed_Clock_Drift',
			i18nDescription: 'SAML_Allowed_Clock_Drift_Description',
		});
		settings.add(`SAML_Custom_${ name }_identifier_format`, defaultIdentifierFormat, {
			type: 'string',
			group: 'SAML',
			section: 'SAML_Section_6_Advanced',
			i18nLabel: 'SAML_Identifier_Format',
			i18nDescription: 'SAML_Identifier_Format_Description',
		});

		settings.add(`SAML_Custom_${ name }_NameId_template`, defaultNameIDTemplate, {
			type: 'string',
			group: 'SAML',
			section: 'SAML_Section_6_Advanced',
			i18nLabel: 'SAML_NameIdPolicy_Template',
			i18nDescription: 'SAML_NameIdPolicy_Template_Description',
			multiline: true,
		});

		settings.add(`SAML_Custom_${ name }_custom_authn_context`, defaultAuthnContext, {
			type: 'string',
			group: 'SAML',
			section: 'SAML_Section_6_Advanced',
			i18nLabel: 'SAML_Custom_Authn_Context',
			i18nDescription: 'SAML_Custom_Authn_Context_description',
		});
		settings.add(`SAML_Custom_${ name }_authn_context_comparison`, 'exact', {
			type: 'select',
			values: [
				{ key: 'better', i18nLabel: 'Better' },
				{ key: 'exact', i18nLabel: 'Exact' },
				{ key: 'maximum', i18nLabel: 'Maximum' },
				{ key: 'minimum', i18nLabel: 'Minimum' },
			],
			group: 'SAML',
			section: 'SAML_Section_6_Advanced',
			i18nLabel: 'SAML_Custom_Authn_Context_Comparison',
		});

		settings.add(`SAML_Custom_${ name }_AuthnContext_template`, defaultAuthnContextTemplate, {
			type: 'string',
			group: 'SAML',
			section: 'SAML_Section_6_Advanced',
			i18nLabel: 'SAML_AuthnContext_Template',
			i18nDescription: 'SAML_AuthnContext_Template_Description',
			multiline: true,
		});


		settings.add(`SAML_Custom_${ name }_AuthRequest_template`, defaultAuthRequestTemplate, {
			type: 'string',
			group: 'SAML',
			section: 'SAML_Section_6_Advanced',
			i18nLabel: 'SAML_AuthnRequest_Template',
			i18nDescription: 'SAML_AuthnRequest_Template_Description',
			multiline: true,
		});

		settings.add(`SAML_Custom_${ name }_LogoutResponse_template`, defaultLogoutResponseTemplate, {
			type: 'string',
			group: 'SAML',
			section: 'SAML_Section_6_Advanced',
			i18nLabel: 'SAML_LogoutResponse_Template',
			i18nDescription: 'SAML_LogoutResponse_Template_Description',
			multiline: true,
		});

		settings.add(`SAML_Custom_${ name }_LogoutRequest_template`, defaultLogoutRequestTemplate, {
			type: 'string',
			group: 'SAML',
			section: 'SAML_Section_6_Advanced',
			i18nLabel: 'SAML_LogoutRequest_Template',
			i18nDescription: 'SAML_Logout_Template_Description',
			multiline: true,
		});

		settings.add(`SAML_Custom_${ name }_MetadataCertificate_template`, defaultMetadataCertificateTemplate, {
			type: 'string',
			group: 'SAML',
			section: 'SAML_Section_6_Advanced',
			i18nLabel: 'SAML_MetadataCertificate_Template',
			i18nDescription: 'SAML_Metadata_Template_Description',
			multiline: true,
		});

		settings.add(`SAML_Custom_${ name }_Metadata_template`, defaultMetadataTemplate, {
			type: 'string',
			group: 'SAML',
			section: 'SAML_Section_6_Advanced',
			i18nLabel: 'SAML_Metadata_Template',
			i18nDescription: 'SAML_Metadata_Template_Description',
			multiline: true,
		});
	},
});
