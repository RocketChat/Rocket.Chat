import { Meteor } from 'meteor/meteor';
import { ServiceConfiguration } from 'meteor/service-configuration';

import { settings, settingsRegistry } from '../../../settings/server';
import { SystemLogger } from '../../../../server/lib/logger/system';
import type { IServiceProviderOptions } from '../definition/IServiceProviderOptions';
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

export const getSamlConfigs = function (service: string): Record<string, any> {
	const configs = {
		buttonLabelText: settings.get(`${service}_button_label_text`),
		buttonLabelColor: settings.get(`${service}_button_label_color`),
		buttonColor: settings.get(`${service}_button_color`),
		clientConfig: {
			provider: settings.get(`${service}_provider`),
		},
		entryPoint: settings.get(`${service}_entry_point`),
		idpSLORedirectURL: settings.get(`${service}_idp_slo_redirect_url`),
		usernameNormalize: settings.get(`${service}_username_normalize`),
		immutableProperty: settings.get(`${service}_immutable_property`),
		generateUsername: settings.get(`${service}_generate_username`),
		debug: settings.get(`${service}_debug`),
		nameOverwrite: settings.get(`${service}_name_overwrite`),
		mailOverwrite: settings.get(`${service}_mail_overwrite`),
		issuer: settings.get(`${service}_issuer`),
		logoutBehaviour: settings.get(`${service}_logout_behaviour`),
		defaultUserRole: settings.get(`${service}_default_user_role`),
		secret: {
			privateKey: settings.get(`${service}_private_key`),
			publicCert: settings.get(`${service}_public_cert`),
			// People often overlook the instruction to remove the header and footer of the certificate on this specific setting, so let's do it for them.
			cert: SAMLUtils.normalizeCert((settings.get(`${service}_cert`) as string) || ''),
		},
		signatureValidationType: settings.get(`${service}_signature_validation_type`),
		userDataFieldMap: settings.get(`${service}_user_data_fieldmap`),
		allowedClockDrift: settings.get(`${service}_allowed_clock_drift`),
		customAuthnContext: defaultAuthnContext,
		authnContextComparison: 'exact',
		identifierFormat: defaultIdentifierFormat,
		nameIDPolicyTemplate: defaultNameIDTemplate,
		authnContextTemplate: defaultAuthnContextTemplate,
		authRequestTemplate: defaultAuthRequestTemplate,
		logoutResponseTemplate: defaultLogoutResponseTemplate,
		logoutRequestTemplate: defaultLogoutRequestTemplate,
		metadataCertificateTemplate: defaultMetadataCertificateTemplate,
		metadataTemplate: defaultMetadataTemplate,
		channelsAttributeUpdate: settings.get(`${service}_channels_update`),
		includePrivateChannelsInUpdate: settings.get(`${service}_include_private_channels_update`),
	};

	SAMLUtils.events.emit('loadConfigs', service, configs);
	return configs;
};

export const configureSamlService = function (samlConfigs: Record<string, any>): IServiceProviderOptions {
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
		callbackUrl: Meteor.absoluteUrl(`_saml/validate/${samlConfigs.clientConfig.provider}`),
	};
};

export const loadSamlServiceProviders = function (): void {
	const serviceName = 'saml';
	const services = settings.getByRegexp(/^(SAML_Custom_)[a-z]+$/i);

	if (!services) {
		return SAMLUtils.setServiceProvidersList([]);
	}

	const providers = services
		.map(([key, value]) => {
			if (value === true) {
				const samlConfigs = getSamlConfigs(key);
				SAMLUtils.log(key);
				ServiceConfiguration.configurations.upsert(
					{
						service: serviceName.toLowerCase(),
					},
					{
						$set: samlConfigs,
					},
				);
				return configureSamlService(samlConfigs);
			}
			ServiceConfiguration.configurations.remove({
				service: serviceName.toLowerCase(),
			});
			return false;
		})
		.filter((e) => e) as IServiceProviderOptions[];

	SAMLUtils.setServiceProvidersList(providers);
};

export const addSamlService = function (name: string): void {
	SystemLogger.warn(`Adding ${name} is deprecated`);
};

export const addSettings = function (name: string): void {
	settingsRegistry.addGroup('SAML', function () {
		this.with(
			{
				tab: 'SAML_Connection',
			},
			function () {
				this.add(`SAML_Custom_${name}`, false, {
					type: 'boolean',
					i18nLabel: 'Accounts_OAuth_Custom_Enable',
				});
				this.add(`SAML_Custom_${name}_provider`, 'provider-name', {
					type: 'string',
					i18nLabel: 'SAML_Custom_Provider',
				});
				this.add(`SAML_Custom_${name}_entry_point`, 'https://example.com/simplesaml/saml2/idp/SSOService.php', {
					type: 'string',
					i18nLabel: 'SAML_Custom_Entry_point',
				});
				this.add(`SAML_Custom_${name}_idp_slo_redirect_url`, 'https://example.com/simplesaml/saml2/idp/SingleLogoutService.php', {
					type: 'string',
					i18nLabel: 'SAML_Custom_IDP_SLO_Redirect_URL',
				});
				this.add(`SAML_Custom_${name}_issuer`, 'https://your-rocket-chat/_saml/metadata/provider-name', {
					type: 'string',
					i18nLabel: 'SAML_Custom_Issuer',
				});
				this.add(`SAML_Custom_${name}_debug`, false, {
					type: 'boolean',
					i18nLabel: 'SAML_Custom_Debug',
				});

				this.section('SAML_Section_2_Certificate', function () {
					this.add(`SAML_Custom_${name}_cert`, '', {
						type: 'string',
						i18nLabel: 'SAML_Custom_Cert',
						multiline: true,
						secret: true,
					});
					this.add(`SAML_Custom_${name}_public_cert`, '', {
						type: 'string',
						multiline: true,
						i18nLabel: 'SAML_Custom_Public_Cert',
					});
					this.add(`SAML_Custom_${name}_signature_validation_type`, 'All', {
						type: 'select',
						values: [
							{ key: 'Response', i18nLabel: 'SAML_Custom_signature_validation_response' },
							{ key: 'Assertion', i18nLabel: 'SAML_Custom_signature_validation_assertion' },
							{ key: 'Either', i18nLabel: 'SAML_Custom_signature_validation_either' },
							{ key: 'All', i18nLabel: 'SAML_Custom_signature_validation_all' },
						],
						i18nLabel: 'SAML_Custom_signature_validation_type',
						i18nDescription: 'SAML_Custom_signature_validation_type_description',
					});
					this.add(`SAML_Custom_${name}_private_key`, '', {
						type: 'string',
						multiline: true,
						i18nLabel: 'SAML_Custom_Private_Key',
						secret: true,
					});
				});
			},
		);

		this.with(
			{
				tab: 'SAML_General',
			},
			function () {
				this.section('SAML_Section_1_User_Interface', function () {
					this.add(`SAML_Custom_${name}_button_label_text`, 'SAML', {
						type: 'string',
						i18nLabel: 'Accounts_OAuth_Custom_Button_Label_Text',
					});
					this.add(`SAML_Custom_${name}_button_label_color`, '#FFFFFF', {
						type: 'string',
						i18nLabel: 'Accounts_OAuth_Custom_Button_Label_Color',
					});
					this.add(`SAML_Custom_${name}_button_color`, '#1d74f5', {
						type: 'string',
						i18nLabel: 'Accounts_OAuth_Custom_Button_Color',
					});
				});

				this.section('SAML_Section_3_Behavior', function () {
					// Settings to customize behavior
					this.add(`SAML_Custom_${name}_generate_username`, false, {
						type: 'boolean',
						i18nLabel: 'SAML_Custom_Generate_Username',
					});
					this.add(`SAML_Custom_${name}_username_normalize`, 'None', {
						type: 'select',
						values: [
							{ key: 'None', i18nLabel: 'SAML_Custom_Username_Normalize_None' },
							{ key: 'Lowercase', i18nLabel: 'SAML_Custom_Username_Normalize_Lowercase' },
						],
						i18nLabel: 'SAML_Custom_Username_Normalize',
					});
					this.add(`SAML_Custom_${name}_immutable_property`, 'EMail', {
						type: 'select',
						values: [
							{ key: 'Username', i18nLabel: 'SAML_Custom_Immutable_Property_Username' },
							{ key: 'EMail', i18nLabel: 'SAML_Custom_Immutable_Property_EMail' },
						],
						i18nLabel: 'SAML_Custom_Immutable_Property',
					});
					this.add(`SAML_Custom_${name}_name_overwrite`, false, {
						type: 'boolean',
						i18nLabel: 'SAML_Custom_name_overwrite',
					});
					this.add(`SAML_Custom_${name}_mail_overwrite`, false, {
						type: 'boolean',
						i18nLabel: 'SAML_Custom_mail_overwrite',
					});
					this.add(`SAML_Custom_${name}_logout_behaviour`, 'SAML', {
						type: 'select',
						values: [
							{ key: 'SAML', i18nLabel: 'SAML_Custom_Logout_Behaviour_Terminate_SAML_Session' },
							{ key: 'Local', i18nLabel: 'SAML_Custom_Logout_Behaviour_End_Only_RocketChat' },
						],
						i18nLabel: 'SAML_Custom_Logout_Behaviour',
					});
					this.add(`SAML_Custom_${name}_channels_update`, false, {
						type: 'boolean',
						i18nLabel: 'SAML_Custom_channels_update',
						i18nDescription: 'SAML_Custom_channels_update_description',
					});
					this.add(`SAML_Custom_${name}_include_private_channels_update`, false, {
						type: 'boolean',
						i18nLabel: 'SAML_Custom_include_private_channels_update',
						i18nDescription: 'SAML_Custom_include_private_channels_update_description',
					});

					this.add(`SAML_Custom_${name}_default_user_role`, 'user', {
						type: 'string',
						i18nLabel: 'SAML_Default_User_Role',
						i18nDescription: 'SAML_Default_User_Role_Description',
					});

					this.add(`SAML_Custom_${name}_allowed_clock_drift`, false, {
						type: 'int',
						invalidValue: 0,
						i18nLabel: 'SAML_Allowed_Clock_Drift',
						i18nDescription: 'SAML_Allowed_Clock_Drift_Description',
					});
				});

				this.section('SAML_Section_5_Mapping', function () {
					// Data Mapping Settings
					this.add(`SAML_Custom_${name}_user_data_fieldmap`, '{"username":"username", "email":"email", "name": "cn"}', {
						type: 'string',
						i18nLabel: 'SAML_Custom_user_data_fieldmap',
						i18nDescription: 'SAML_Custom_user_data_fieldmap_description',
						multiline: true,
					});
				});
			},
		);

		SAMLUtils.events.emit('addSettings', name);
	});
};
