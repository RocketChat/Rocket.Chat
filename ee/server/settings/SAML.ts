import { defaultAuthnContext, defaultAuthnContextTemplate, defaultAuthRequestTemplate, defaultLogoutResponseTemplate, defaultLogoutRequestTemplate, defaultMetadataCertificateTemplate, defaultMetadataTemplate, defaultNameIDTemplate, defaultIdentifierFormat } from '../../../app/meteor-accounts-saml/server/lib/constants';
import { onLicense } from '../../app/license/server';
import { settings } from '../../../app/settings/server/functions/settings';

Meteor.startup(() => onLicense('SAML-enterprise', () => {
	// role sync
	settings.add('SAML_Custom_Custom_Default_role_attribute_sync', false, {
		type: 'boolean',
		group: 'SAML',
		section: 'SAML_Section_4_Roles',
		i18nLabel: 'SAML_Role_Attribute_Sync',
		i18nDescription: 'SAML_Role_Attribute_Sync_Description',
	});
	settings.add('SAML_Custom_Custom_Default_role_attribute_name', '', {
		type: 'string',
		group: 'SAML',
		section: 'SAML_Section_4_Roles',
		i18nLabel: 'SAML_Role_Attribute_Name',
		i18nDescription: 'SAML_Role_Attribute_Name_Description',
	});
	// advanced
	settings.add('SAML_Custom_Custom_Default_allowed_clock_drift', false, {
		type: 'int',
		group: 'SAML',
		enterprise: true,
		invalidValue: false,
		section: 'SAML_Section_6_Advanced',
		i18nLabel: 'SAML_Allowed_Clock_Drift',
		i18nDescription: 'SAML_Allowed_Clock_Drift_Description',
	});
	settings.add('SAML_Custom_Custom_Default_identifier_format', defaultIdentifierFormat, {
		type: 'string',
		group: 'SAML',
		enterprise: true,
		invalidValue: false,
		section: 'SAML_Section_6_Advanced',
		i18nLabel: 'SAML_Identifier_Format',
		i18nDescription: 'SAML_Identifier_Format_Description',
	});
	settings.add('SAML_Custom_Custom_Default_NameId_template', defaultNameIDTemplate, {
		type: 'string',
		group: 'SAML',
		enterprise: true,
		invalidValue: false,
		section: 'SAML_Section_6_Advanced',
		i18nLabel: 'SAML_NameIdPolicy_Template',
		i18nDescription: 'SAML_NameIdPolicy_Template_Description',
		multiline: true,
	});
	settings.add('SAML_Custom_Custom_Default_custom_authn_context', defaultAuthnContext, {
		type: 'string',
		group: 'SAML',
		enterprise: true,
		invalidValue: false,
		section: 'SAML_Section_6_Advanced',
		i18nLabel: 'SAML_Custom_Authn_Context',
		i18nDescription: 'SAML_Custom_Authn_Context_description',
	});
	settings.add('SAML_Custom_Custom_Default_authn_context_comparison', 'exact', {
		type: 'select',
		values: [
			{ key: 'better', i18nLabel: 'Better' },
			{ key: 'exact', i18nLabel: 'Exact' },
			{ key: 'maximum', i18nLabel: 'Maximum' },
			{ key: 'minimum', i18nLabel: 'Minimum' },
		],
		group: 'SAML',
		enterprise: true,
		invalidValue: false,
		section: 'SAML_Section_6_Advanced',
		i18nLabel: 'SAML_Custom_Authn_Context_Comparison',
	});

	settings.add('SAML_Custom_Custom_Default_AuthnContext_template', defaultAuthnContextTemplate, {
		type: 'string',
		group: 'SAML',
		enterprise: true,
		invalidValue: false,
		section: 'SAML_Section_6_Advanced',
		i18nLabel: 'SAML_AuthnContext_Template',
		i18nDescription: 'SAML_AuthnContext_Template_Description',
		multiline: true,
	});


	settings.add('SAML_Custom_Custom_Default_AuthRequest_template', defaultAuthRequestTemplate, {
		type: 'string',
		group: 'SAML',
		enterprise: true,
		invalidValue: false,
		section: 'SAML_Section_6_Advanced',
		i18nLabel: 'SAML_AuthnRequest_Template',
		i18nDescription: 'SAML_AuthnRequest_Template_Description',
		multiline: true,
	});

	settings.add('SAML_Custom_Custom_Default_LogoutResponse_template', defaultLogoutResponseTemplate, {
		type: 'string',
		group: 'SAML',
		enterprise: true,
		invalidValue: false,
		section: 'SAML_Section_6_Advanced',
		i18nLabel: 'SAML_LogoutResponse_Template',
		i18nDescription: 'SAML_LogoutResponse_Template_Description',
		multiline: true,
	});

	settings.add('SAML_Custom_Custom_Default_LogoutRequest_template', defaultLogoutRequestTemplate, {
		type: 'string',
		group: 'SAML',
		enterprise: true,
		invalidValue: false,
		section: 'SAML_Section_6_Advanced',
		i18nLabel: 'SAML_LogoutRequest_Template',
		i18nDescription: 'SAML_LogoutRequest_Template_Description',
		multiline: true,
	});

	settings.add('SAML_Custom_Custom_Default_MetadataCertificate_template', defaultMetadataCertificateTemplate, {
		type: 'string',
		group: 'SAML',
		enterprise: true,
		invalidValue: false,
		section: 'SAML_Section_6_Advanced',
		i18nLabel: 'SAML_MetadataCertificate_Template',
		i18nDescription: 'SAML_Metadata_Certificate_Template_Description',
		multiline: true,
	});

	settings.add('SAML_Custom_Custom_Default_Metadata_template', defaultMetadataTemplate, {
		type: 'string',
		group: 'SAML',
		enterprise: true,
		invalidValue: false,
		section: 'SAML_Section_6_Advanced',
		i18nLabel: 'SAML_Metadata_Template',
		i18nDescription: 'SAML_Metadata_Template_Description',
		multiline: true,
	});
}));
