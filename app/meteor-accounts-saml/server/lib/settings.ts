import { Meteor } from 'meteor/meteor';
import { ServiceConfiguration } from 'meteor/service-configuration';

import { settings } from '../../../settings/server';
import { SettingComposedValue } from '../../../settings/lib/settings';
import { IServiceProviderOptions } from '../definition/IServiceProviderOptions';
import { SAMLUtils } from './Utils';

// Settings are created on the addSamlService method

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
