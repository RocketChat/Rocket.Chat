import { settingsRegistry } from '../../../app/settings/server';
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
} from '../../../app/meteor-accounts-saml/server/lib/constants';

export const addSettings = function (name: string): void {
	settingsRegistry.addGroup('SAML', function () {
		this.with(
			{
				tab: 'SAML_Enterprise',
				enterprise: true,
				modules: ['saml-enterprise'],
			},
			function () {
				this.section('SAML_Section_4_Roles', function () {
					// Roles Settings
					this.add(`SAML_Custom_${name}_role_attribute_sync`, false, {
						type: 'boolean',
						i18nLabel: 'SAML_Role_Attribute_Sync',
						i18nDescription: 'SAML_Role_Attribute_Sync_Description',
						invalidValue: false,
					});
					this.add(`SAML_Custom_${name}_role_attribute_name`, '', {
						type: 'string',
						i18nLabel: 'SAML_Role_Attribute_Name',
						i18nDescription: 'SAML_Role_Attribute_Name_Description',
						invalidValue: '',
					});
				});

				this.section('SAML_Section_6_Advanced', function () {
					this.add(`SAML_Custom_${name}_identifier_format`, defaultIdentifierFormat, {
						type: 'string',
						invalidValue: defaultIdentifierFormat,
						i18nLabel: 'SAML_Identifier_Format',
						i18nDescription: 'SAML_Identifier_Format_Description',
					});
					this.add(`SAML_Custom_${name}_NameId_template`, defaultNameIDTemplate, {
						type: 'string',
						invalidValue: defaultNameIDTemplate,
						i18nLabel: 'SAML_NameIdPolicy_Template',
						i18nDescription: 'SAML_NameIdPolicy_Template_Description',
						multiline: true,
					});
					this.add(`SAML_Custom_${name}_custom_authn_context`, defaultAuthnContext, {
						type: 'string',
						invalidValue: defaultAuthnContext,
						i18nLabel: 'SAML_Custom_Authn_Context',
						i18nDescription: 'SAML_Custom_Authn_Context_description',
					});
					this.add(`SAML_Custom_${name}_authn_context_comparison`, 'exact', {
						type: 'select',
						values: [
							{ key: 'better', i18nLabel: 'Better' },
							{ key: 'exact', i18nLabel: 'Exact' },
							{ key: 'maximum', i18nLabel: 'Maximum' },
							{ key: 'minimum', i18nLabel: 'Minimum' },
						],
						invalidValue: 'exact',
						i18nLabel: 'SAML_Custom_Authn_Context_Comparison',
					});
					this.add(`SAML_Custom_${name}_AuthnContext_template`, defaultAuthnContextTemplate, {
						type: 'string',
						invalidValue: defaultAuthnContextTemplate,
						i18nLabel: 'SAML_AuthnContext_Template',
						i18nDescription: 'SAML_AuthnContext_Template_Description',
						multiline: true,
					});
					this.add(`SAML_Custom_${name}_AuthRequest_template`, defaultAuthRequestTemplate, {
						type: 'string',
						invalidValue: defaultAuthRequestTemplate,
						i18nLabel: 'SAML_AuthnRequest_Template',
						i18nDescription: 'SAML_AuthnRequest_Template_Description',
						multiline: true,
					});
					this.add(`SAML_Custom_${name}_LogoutResponse_template`, defaultLogoutResponseTemplate, {
						type: 'string',
						invalidValue: defaultLogoutResponseTemplate,
						i18nLabel: 'SAML_LogoutResponse_Template',
						i18nDescription: 'SAML_LogoutResponse_Template_Description',
						multiline: true,
					});
					this.add(`SAML_Custom_${name}_LogoutRequest_template`, defaultLogoutRequestTemplate, {
						type: 'string',
						invalidValue: defaultLogoutRequestTemplate,
						i18nLabel: 'SAML_LogoutRequest_Template',
						i18nDescription: 'SAML_LogoutRequest_Template_Description',
						multiline: true,
					});
					this.add(`SAML_Custom_${name}_MetadataCertificate_template`, defaultMetadataCertificateTemplate, {
						type: 'string',
						invalidValue: defaultMetadataCertificateTemplate,
						i18nLabel: 'SAML_MetadataCertificate_Template',
						i18nDescription: 'SAML_Metadata_Certificate_Template_Description',
						multiline: true,
					});
					this.add(`SAML_Custom_${name}_Metadata_template`, defaultMetadataTemplate, {
						type: 'string',
						invalidValue: defaultMetadataTemplate,
						i18nLabel: 'SAML_Metadata_Template',
						i18nDescription: 'SAML_Metadata_Template_Description',
						multiline: true,
					});
				});
				this.section('SAML_Section_5_Mapping', function () {
					// Data Mapping Settings
					this.add(`SAML_Custom_${name}_user_data_custom_fieldmap`, '{"custom1":"custom1", "custom2":"custom2", "custom3":"custom3"}', {
						type: 'string',
						invalidValue: '',
						i18nLabel: 'SAML_Custom_user_data_custom_fieldmap',
						i18nDescription: 'SAML_Custom_user_data_custom_fieldmap_description',
						multiline: true,
					});
				});
			},
		);
	});
};
