import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { ServiceConfiguration } from 'meteor/service-configuration';

import { Logger } from '../../logger';
import { settings } from '../../settings';

const logger = new Logger('steffo:meteor-accounts-saml', {
	methods: {
		updated: {
			type: 'info',
		},
	},
});

settings.addGroup('SAML');

Meteor.methods({
	addSamlService(name) {
		settings.add(`SAML_Custom_${ name }`, false, {
			type: 'boolean',
			group: 'SAML',
			section: name,
			i18nLabel: 'Accounts_OAuth_Custom_Enable',
		});
		settings.add(`SAML_Custom_${ name }_provider`, 'provider-name', {
			type: 'string',
			group: 'SAML',
			section: name,
			i18nLabel: 'SAML_Custom_Provider',
		});
		settings.add(`SAML_Custom_${ name }_entry_point`, 'https://example.com/simplesaml/saml2/idp/SSOService.php', {
			type: 'string',
			group: 'SAML',
			section: name,
			i18nLabel: 'SAML_Custom_Entry_point',
		});
		settings.add(`SAML_Custom_${ name }_idp_slo_redirect_url`, 'https://example.com/simplesaml/saml2/idp/SingleLogoutService.php', {
			type: 'string',
			group: 'SAML',
			section: name,
			i18nLabel: 'SAML_Custom_IDP_SLO_Redirect_URL',
		});
		settings.add(`SAML_Custom_${ name }_issuer`, 'https://your-rocket-chat/_saml/metadata/provider-name', {
			type: 'string',
			group: 'SAML',
			section: name,
			i18nLabel: 'SAML_Custom_Issuer',
		});
		settings.add(`SAML_Custom_${ name }_cert`, '', {
			type: 'string',
			group: 'SAML',
			section: name,
			i18nLabel: 'SAML_Custom_Cert',
			multiline: true,
			secret: true,
		});
		settings.add(`SAML_Custom_${ name }_public_cert`, '', {
			type: 'string',
			group: 'SAML',
			section: name,
			multiline: true,
			i18nLabel: 'SAML_Custom_Public_Cert',
		});
		settings.add(`SAML_Custom_${ name }_private_key`, '', {
			type: 'string',
			group: 'SAML',
			section: name,
			multiline: true,
			i18nLabel: 'SAML_Custom_Private_Key',
			secret: true,
		});
		settings.add(`SAML_Custom_${ name }_button_label_text`, '', {
			type: 'string',
			group: 'SAML',
			section: name,
			i18nLabel: 'Accounts_OAuth_Custom_Button_Label_Text',
		});
		settings.add(`SAML_Custom_${ name }_button_label_color`, '#FFFFFF', {
			type: 'string',
			group: 'SAML',
			section: name,
			i18nLabel: 'Accounts_OAuth_Custom_Button_Label_Color',
		});
		settings.add(`SAML_Custom_${ name }_button_color`, '#1d74f5', {
			type: 'string',
			group: 'SAML',
			section: name,
			i18nLabel: 'Accounts_OAuth_Custom_Button_Color',
		});
		settings.add(`SAML_Custom_${ name }_generate_username`, false, {
			type: 'boolean',
			group: 'SAML',
			section: name,
			i18nLabel: 'SAML_Custom_Generate_Username',
		});
		settings.add(`SAML_Custom_${ name }_debug`, false, {
			type: 'boolean',
			group: 'SAML',
			section: name,
			i18nLabel: 'SAML_Custom_Debug',
		});
		settings.add(`SAML_Custom_${ name }_name_overwrite`, false, {
			type: 'boolean',
			group: 'SAML',
			section: name,
			i18nLabel: 'SAML_Custom_name_overwrite',
		});
		settings.add(`SAML_Custom_${ name }_mail_overwrite`, false, {
			type: 'boolean',
			group: 'SAML',
			section: name,
			i18nLabel: 'SAML_Custom_mail_overwrite',
		});
		settings.add(`SAML_Custom_${ name }_logout_behaviour`, 'SAML', {
			type: 'select',
			values: [
				{ key: 'SAML', i18nLabel: 'SAML_Custom_Logout_Behaviour_Terminate_SAML_Session' },
				{ key: 'Local', i18nLabel: 'SAML_Custom_Logout_Behaviour_End_Only_RocketChat' },
			],
			group: 'SAML',
			section: name,
			i18nLabel: 'SAML_Custom_Logout_Behaviour',
		});
		settings.add(`SAML_Custom_${ name }_custom_authn_context`, 'urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport', {
			type: 'string',
			group: 'SAML',
			section: name,
			i18nLabel: 'SAML_Custom_Authn_Context',
		});
	},
});

const normalizeCert = function(cert) {
	if (typeof cert === 'string') {
		return cert.replace('-----BEGIN CERTIFICATE-----', '').replace('-----END CERTIFICATE-----', '').trim();
	}

	return cert;
};

const getSamlConfigs = function(service) {
	return {
		buttonLabelText: settings.get(`${ service.key }_button_label_text`),
		buttonLabelColor: settings.get(`${ service.key }_button_label_color`),
		buttonColor: settings.get(`${ service.key }_button_color`),
		clientConfig: {
			provider: settings.get(`${ service.key }_provider`),
		},
		entryPoint: settings.get(`${ service.key }_entry_point`),
		idpSLORedirectURL: settings.get(`${ service.key }_idp_slo_redirect_url`),
		generateUsername: settings.get(`${ service.key }_generate_username`),
		debug: settings.get(`${ service.key }_debug`),
		nameOverwrite: settings.get(`${ service.key }_name_overwrite`),
		mailOverwrite: settings.get(`${ service.key }_mail_overwrite`),
		issuer: settings.get(`${ service.key }_issuer`),
		logoutBehaviour: settings.get(`${ service.key }_logout_behaviour`),
		customAuthnContext: settings.get(`${ service.key }_custom_authn_context`),
		secret: {
			privateKey: settings.get(`${ service.key }_private_key`),
			publicCert: settings.get(`${ service.key }_public_cert`),
			// People often overlook the instruction to remove the header and footer of the certificate on this specific setting, so let's do it for them.
			cert: normalizeCert(settings.get(`${ service.key }_cert`)),
		},
	};
};

const debounce = (fn, delay) => {
	let timer = null;
	return () => {
		if (timer != null) {
			Meteor.clearTimeout(timer);
		}
		timer = Meteor.setTimeout(fn, delay);
		return timer;
	};
};
const serviceName = 'saml';

const configureSamlService = function(samlConfigs) {
	let privateCert = false;
	let privateKey = false;
	if (samlConfigs.secret.privateKey && samlConfigs.secret.publicCert) {
		privateKey = samlConfigs.secret.privateKey;
		privateCert = samlConfigs.secret.publicCert;
	} else if (samlConfigs.secret.privateKey || samlConfigs.secret.publicCert) {
		logger.error('You must specify both cert and key files.');
	}
	// TODO: the function configureSamlService is called many times and Accounts.saml.settings.generateUsername keeps just the last value
	Accounts.saml.settings.generateUsername = samlConfigs.generateUsername;
	Accounts.saml.settings.nameOverwrite = samlConfigs.nameOverwrite;
	Accounts.saml.settings.mailOverwrite = samlConfigs.mailOverwrite;
	Accounts.saml.settings.debug = samlConfigs.debug;

	return {
		provider: samlConfigs.clientConfig.provider,
		entryPoint: samlConfigs.entryPoint,
		idpSLORedirectURL: samlConfigs.idpSLORedirectURL,
		issuer: samlConfigs.issuer,
		cert: samlConfigs.secret.cert,
		privateCert,
		privateKey,
		customAuthnContext: samlConfigs.customAuthnContext,
	};
};

const updateServices = debounce(() => {
	const services = settings.get(/^(SAML_Custom_)[a-z]+$/i);
	Accounts.saml.settings.providers = services.map((service) => {
		if (service.value === true) {
			const samlConfigs = getSamlConfigs(service);
			logger.updated(service.key);
			ServiceConfiguration.configurations.upsert({
				service: serviceName.toLowerCase(),
			}, {
				$set: samlConfigs,
			});
			return configureSamlService(samlConfigs);
		}
		return ServiceConfiguration.configurations.remove({
			service: serviceName.toLowerCase(),
		});
	}).filter((e) => e);
}, 2000);


settings.get(/^SAML_.+/, updateServices);

Meteor.startup(() => Meteor.call('addSamlService', 'Default'));

export {
	updateServices,
	configureSamlService,
	getSamlConfigs,
	debounce,
	logger,
};
