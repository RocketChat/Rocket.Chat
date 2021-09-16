import { Meteor } from 'meteor/meteor';

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
}));
