import { Meteor } from 'meteor/meteor';
import { ServiceConfiguration } from 'meteor/service-configuration';

import { settings } from '../../../settings/server';
import { SystemLogger } from '../../../../server/lib/logger/system';
import { SettingComposedValue } from '../../../settings/lib/settings';
import { IServiceProviderOptions } from '../definition/IServiceProviderOptions';
import { SAMLUtils } from './Utils';
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
} from './constants';

export const getSamlConfigs = function(service: string): Record<string, any> {
	return {
		buttonLabelText: settings.get(`${ service }_button_label_text`),
		buttonLabelColor: settings.get(`${ service }_button_label_color`),
		buttonColor: settings.get(`${ service }_button_color`),
		clientConfig: {
			provider: settings.get(`${ service }_provider`),
		},
		entryPoint: settings.get(`${ service }_entry_point`),
		idpSLORedirectURL: settings.get(`${ service }_idp_slo_redirect_url`),
		usernameNormalize: settings.get(`${ service }_username_normalize`),
		immutableProperty: settings.get(`${ service }_immutable_property`),
		generateUsername: settings.get(`${ service }_generate_username`),
		debug: settings.get(`${ service }_debug`),
		nameOverwrite: settings.get(`${ service }_name_overwrite`),
		mailOverwrite: settings.get(`${ service }_mail_overwrite`),
		issuer: settings.get(`${ service }_issuer`),
		logoutBehaviour: settings.get(`${ service }_logout_behaviour`),
		customAuthnContext: settings.get(`${ service }_custom_authn_context`),
		authnContextComparison: settings.get(`${ service }_authn_context_comparison`),
		defaultUserRole: settings.get(`${ service }_default_user_role`),
		roleAttributeName: settings.get(`${ service }_role_attribute_name`),
		roleAttributeSync: settings.get(`${ service }_role_attribute_sync`),
		secret: {
			privateKey: settings.get(`${ service }_private_key`),
			publicCert: settings.get(`${ service }_public_cert`),
			// People often overlook the instruction to remove the header and footer of the certificate on this specific setting, so let's do it for them.
			cert: SAMLUtils.normalizeCert(settings.get(`${ service }_cert`) as string || ''),
		},
		signatureValidationType: settings.get(`${ service }_signature_validation_type`),
		userDataFieldMap: settings.get(`${ service }_user_data_fieldmap`),
		allowedClockDrift: settings.get(`${ service }_allowed_clock_drift`),
		identifierFormat: settings.get(`${ service }_identifier_format`),
		nameIDPolicyTemplate: settings.get(`${ service }_NameId_template`),
		authnContextTemplate: settings.get(`${ service }_AuthnContext_template`),
		authRequestTemplate: settings.get(`${ service }_AuthRequest_template`),
		logoutResponseTemplate: settings.get(`${ service }_LogoutResponse_template`),
		logoutRequestTemplate: settings.get(`${ service }_LogoutRequest_template`),
		metadataCertificateTemplate: settings.get(`${ service }_MetadataCertificate_template`),
		metadataTemplate: settings.get(`${ service }_Metadata_template`),
		channelsAttributeUpdate: settings.get(`${ service }_channels_update`),
		includePrivateChannelsInUpdate: settings.get(`${ service }_include_private_channels_update`),
	};
};

export const configureSamlService = function(samlConfigs: Record<string, any>): IServiceProviderOptions {
	let privateCert = null;
	let privateKey = null;

	if (samlConfigs.secret.privateKey && samlConfigs.secret.publicCert) {
		privateKey = samlConfigs.secret.privateKey;
		privateCert = samlConfigs.secret.publicCert;
	} else if (samlConfigs.secret.privateKey || samlConfigs.secret.publicCert) {
		SAMLUtils.error('SAML Service: You must specify both cert and key files.');
	}

	SAMLUtils.updateGlobalSettings(samlConfigs);

	return {
		provider: samlConfigs.clientConfig.provider,
		entryPoint: samlConfigs.entryPoint,
		idpSLORedirectURL: samlConfigs.idpSLORedirectURL,
		issuer: samlConfigs.issuer,
		cert: samlConfigs.secret.cert,
		privateCert,
		privateKey,
		customAuthnContext: samlConfigs.customAuthnContext,
		authnContextComparison: samlConfigs.authnContextComparison,
		defaultUserRole: samlConfigs.defaultUserRole,
		roleAttributeName: samlConfigs.roleAttributeName,
		roleAttributeSync: samlConfigs.roleAttributeSync,
		allowedClockDrift: parseInt(samlConfigs.allowedClockDrift) || 0,
		signatureValidationType: samlConfigs.signatureValidationType,
		identifierFormat: samlConfigs.identifierFormat,
		nameIDPolicyTemplate: samlConfigs.nameIDPolicyTemplate,
		authnContextTemplate: samlConfigs.authnContextTemplate,
		authRequestTemplate: samlConfigs.authRequestTemplate,
		logoutResponseTemplate: samlConfigs.logoutResponseTemplate,
		logoutRequestTemplate: samlConfigs.logoutRequestTemplate,
		metadataCertificateTemplate: samlConfigs.metadataCertificateTemplate,
		metadataTemplate: samlConfigs.metadataTemplate,
		callbackUrl: Meteor.absoluteUrl(`_saml/validate/${ samlConfigs.clientConfig.provider }`),
	};
};

export const loadSamlServiceProviders = function(): void {
	const serviceName = 'saml';
	const services = settings.get(/^(SAML_Custom_)[a-z]+$/i) as SettingComposedValue[] | undefined;

	if (!services) {
		return SAMLUtils.setServiceProvidersList([]);
	}

	const providers = services.map((service) => {
		if (service.value === true) {
			const samlConfigs = getSamlConfigs(service.key);
			SAMLUtils.log(service.key);
			ServiceConfiguration.configurations.upsert({
				service: serviceName.toLowerCase(),
			}, {
				$set: samlConfigs,
			});
			return configureSamlService(samlConfigs);
		}
		ServiceConfiguration.configurations.remove({
			service: serviceName.toLowerCase(),
		});
		return false;
	}).filter((e) => e) as IServiceProviderOptions[];

	SAMLUtils.setServiceProvidersList(providers);
};

export const addSamlService = function(name: string): void {
	SystemLogger.warn(`Adding ${ name } is deprecated`);
};

export const addSettings = function(name: string): void {
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
	settings.add(`SAML_Custom_${ name }_channels_update`, false, {
		type: 'boolean',
		group: 'SAML',
		section: 'SAML_Section_3_Behavior',
		i18nLabel: 'SAML_Custom_channels_update',
		i18nDescription: 'SAML_Custom_channels_update_description',
	});
	settings.add(`SAML_Custom_${ name }_include_private_channels_update`, false, {
		type: 'boolean',
		group: 'SAML',
		section: 'SAML_Section_3_Behavior',
		i18nLabel: 'SAML_Custom_include_private_channels_update',
		i18nDescription: 'SAML_Custom_include_private_channels_update_description',
	});

	// Roles Settings
	settings.add(`SAML_Custom_${ name }_default_user_role`, 'user', {
		type: 'string',
		group: 'SAML',
		section: 'SAML_Section_4_Roles',
		i18nLabel: 'SAML_Default_User_Role',
		i18nDescription: 'SAML_Default_User_Role_Description',
	});
	settings.add('SAML_Custom_Custom_Default_role_attribute_sync', false, {
		type: 'boolean',
		group: 'SAML',
		section: 'SAML_Section_4_Roles',
		i18nLabel: 'SAML_Role_Attribute_Sync',
		i18nDescription: 'SAML_Role_Attribute_Sync_Description',
		enterprise: true,
		invalidValue: false,
	});
	settings.add('SAML_Custom_Custom_Default_role_attribute_name', '', {
		type: 'string',
		group: 'SAML',
		section: 'SAML_Section_4_Roles',
		i18nLabel: 'SAML_Role_Attribute_Name',
		i18nDescription: 'SAML_Role_Attribute_Name_Description',
		enterprise: true,
		invalidValue: '',
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

	// advanced
	settings.add('SAML_Custom_Custom_Default_allowed_clock_drift', false, {
		type: 'int',
		group: 'SAML',
		enterprise: true,
		invalidValue: 0,
		section: 'SAML_Section_6_Advanced',
		i18nLabel: 'SAML_Allowed_Clock_Drift',
		i18nDescription: 'SAML_Allowed_Clock_Drift_Description',
	});
	settings.add('SAML_Custom_Custom_Default_identifier_format', defaultIdentifierFormat, {
		type: 'string',
		group: 'SAML',
		enterprise: true,
		invalidValue: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
		section: 'SAML_Section_6_Advanced',
		i18nLabel: 'SAML_Identifier_Format',
		i18nDescription: 'SAML_Identifier_Format_Description',
	});
	settings.add('SAML_Custom_Custom_Default_NameId_template', defaultNameIDTemplate, {
		type: 'string',
		group: 'SAML',
		enterprise: true,
		invalidValue: '<samlp:NameIDPolicy xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" Format="__identifierFormat__" AllowCreate="true"></samlp:NameIDPolicy>',
		section: 'SAML_Section_6_Advanced',
		i18nLabel: 'SAML_NameIdPolicy_Template',
		i18nDescription: 'SAML_NameIdPolicy_Template_Description',
		multiline: true,
	});
	settings.add('SAML_Custom_Custom_Default_custom_authn_context', defaultAuthnContext, {
		type: 'string',
		group: 'SAML',
		enterprise: true,
		invalidValue: 'urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport',
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
		invalidValue: 'exact',
		section: 'SAML_Section_6_Advanced',
		i18nLabel: 'SAML_Custom_Authn_Context_Comparison',
	});
	settings.add('SAML_Custom_Custom_Default_AuthnContext_template', defaultAuthnContextTemplate, {
		type: 'string',
		group: 'SAML',
		enterprise: true,
		invalidValue: `<samlp:RequestedAuthnContext xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" Comparison="__authnContextComparison__">
		<saml:AuthnContextClassRef xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">
		  __authnContext__
		</saml:AuthnContextClassRef>
	  </samlp:RequestedAuthnContext>`,
		section: 'SAML_Section_6_Advanced',
		i18nLabel: 'SAML_AuthnContext_Template',
		i18nDescription: 'SAML_AuthnContext_Template_Description',
		multiline: true,
	});
	settings.add('SAML_Custom_Custom_Default_AuthRequest_template', defaultAuthRequestTemplate, {
		type: 'string',
		group: 'SAML',
		enterprise: true,
		invalidValue: `<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" ID="__newId__" Version="2.0" IssueInstant="__instant__" ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" AssertionConsumerServiceURL="__callbackUrl__" Destination="__entryPoint__">
		<saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">__issuer__</saml:Issuer>
		__identifierFormatTag__
		__authnContextTag__
	  </samlp:AuthnRequest>`,
		section: 'SAML_Section_6_Advanced',
		i18nLabel: 'SAML_AuthnRequest_Template',
		i18nDescription: 'SAML_AuthnRequest_Template_Description',
		multiline: true,
	});
	settings.add('SAML_Custom_Custom_Default_LogoutResponse_template', defaultLogoutResponseTemplate, {
		type: 'string',
		group: 'SAML',
		enterprise: true,
		invalidValue: `<samlp:LogoutResponse xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" ID="__inResponseToId__" Version="2.0" IssueInstant="__instant__" Destination="__idpSLORedirectURL__">
		<saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">__issuer__</saml:Issuer>
		<samlp:Status><samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/></samlp:Status>
	  </samlp:LogoutResponse>`,
		section: 'SAML_Section_6_Advanced',
		i18nLabel: 'SAML_LogoutResponse_Template',
		i18nDescription: 'SAML_LogoutResponse_Template_Description',
		multiline: true,
	});
	settings.add('SAML_Custom_Custom_Default_LogoutRequest_template', defaultLogoutRequestTemplate, {
		type: 'string',
		group: 'SAML',
		enterprise: true,
		invalidValue: `<samlp:LogoutRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" ID="__newId__" Version="2.0" IssueInstant="__instant__" Destination="__idpSLORedirectURL__">
		<saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">__issuer__</saml:Issuer>
		<saml:NameID xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" NameQualifier="http://id.init8.net:8080/openam" SPNameQualifier="__issuer__" Format="__identifierFormat__">__nameID__</saml:NameID>
		<samlp:SessionIndex xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol">__sessionIndex__</samlp:SessionIndex>
	  </samlp:LogoutRequest>`,
		section: 'SAML_Section_6_Advanced',
		i18nLabel: 'SAML_LogoutRequest_Template',
		i18nDescription: 'SAML_LogoutRequest_Template_Description',
		multiline: true,
	});
	settings.add('SAML_Custom_Custom_Default_MetadataCertificate_template', defaultMetadataCertificateTemplate, {
		type: 'string',
		group: 'SAML',
		enterprise: true,
		invalidValue: `    <KeyDescriptor>
		<ds:KeyInfo>
		  <ds:X509Data>
			<ds:X509Certificate>__certificate__</ds:X509Certificate>
		  </ds:X509Data>
		</ds:KeyInfo>
		<EncryptionMethod Algorithm="http://www.w3.org/2001/04/xmlenc#aes256-cbc"/>
		<EncryptionMethod Algorithm="http://www.w3.org/2001/04/xmlenc#aes128-cbc"/>
		<EncryptionMethod Algorithm="http://www.w3.org/2001/04/xmlenc#tripledes-cbc"/>
	  </KeyDescriptor>`,
		section: 'SAML_Section_6_Advanced',
		i18nLabel: 'SAML_MetadataCertificate_Template',
		i18nDescription: 'SAML_Metadata_Certificate_Template_Description',
		multiline: true,
	});
	settings.add('SAML_Custom_Custom_Default_Metadata_template', defaultMetadataTemplate, {
		type: 'string',
		group: 'SAML',
		enterprise: true,
		invalidValue: `<?xml version="1.0"?>
		<EntityDescriptor xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:SAML:2.0:metadata https://docs.oasis-open.org/security/saml/v2.0/saml-schema-metadata-2.0.xsd" xmlns="urn:oasis:names:tc:SAML:2.0:metadata" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" entityID="__issuer__">
		  <SPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">__certificateTag__
			<SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="__sloLocation__" ResponseLocation="__sloLocation__"/>
			<NameIDFormat>__identifierFormat__</NameIDFormat>
			<AssertionConsumerService index="1" isDefault="true" Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="__callbackUrl__"/>
		  </SPSSODescriptor>
		</EntityDescriptor>`,
		section: 'SAML_Section_6_Advanced',
		i18nLabel: 'SAML_Metadata_Template',
		i18nDescription: 'SAML_Metadata_Template_Description',
		multiline: true,
	});
};
