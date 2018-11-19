import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { RocketChat } from 'meteor/rocketchat:lib';
import { Logger } from 'meteor/rocketchat:logger';
import { ServiceConfiguration } from 'meteor/service-configuration';

const logger = new Logger('steffo:meteor-accounts-saml', {
	methods: {
		updated: {
			type: 'info',
		},
	},
});

RocketChat.settings.addGroup('SAML');

Meteor.methods({
	addSamlService(name) {
		RocketChat.settings.add(`SAML_Custom_${ name }`, false, {
			type: 'boolean',
			group: 'SAML',
			section: name,
			i18nLabel: 'Accounts_OAuth_Custom_Enable',
		});
		RocketChat.settings.add(`SAML_Custom_${ name }_provider`, 'provider-name', {
			type: 'string',
			group: 'SAML',
			section: name,
			i18nLabel: 'SAML_Custom_Provider',
		});
		RocketChat.settings.add(`SAML_Custom_${ name }_entry_point`, 'https://example.com/simplesaml/saml2/idp/SSOService.php', {
			type: 'string',
			group: 'SAML',
			section: name,
			i18nLabel: 'SAML_Custom_Entry_point',
		});
		RocketChat.settings.add(`SAML_Custom_${ name }_idp_slo_redirect_url`, 'https://example.com/simplesaml/saml2/idp/SingleLogoutService.php', {
			type: 'string',
			group: 'SAML',
			section: name,
			i18nLabel: 'SAML_Custom_IDP_SLO_Redirect_URL',
		});
		RocketChat.settings.add(`SAML_Custom_${ name }_issuer`, 'https://your-rocket-chat/_saml/metadata/provider-name', {
			type: 'string',
			group: 'SAML',
			section: name,
			i18nLabel: 'SAML_Custom_Issuer',
		});
		RocketChat.settings.add(`SAML_Custom_${ name }_cert`, '', {
			type: 'string',
			group: 'SAML',
			section: name,
			i18nLabel: 'SAML_Custom_Cert',
			multiline: true,
		});
		RocketChat.settings.add(`SAML_Custom_${ name }_public_cert`, '', {
			type: 'string',
			group: 'SAML',
			section: name,
			multiline: true,
			i18nLabel: 'SAML_Custom_Public_Cert',
		});
		RocketChat.settings.add(`SAML_Custom_${ name }_private_key`, '', {
			type: 'string',
			group: 'SAML',
			section: name,
			multiline: true,
			i18nLabel: 'SAML_Custom_Private_Key',
		});
		RocketChat.settings.add(`SAML_Custom_${ name }_button_label_text`, '', {
			type: 'string',
			group: 'SAML',
			section: name,
			i18nLabel: 'Accounts_OAuth_Custom_Button_Label_Text',
		});
		RocketChat.settings.add(`SAML_Custom_${ name }_button_label_color`, '#FFFFFF', {
			type: 'string',
			group: 'SAML',
			section: name,
			i18nLabel: 'Accounts_OAuth_Custom_Button_Label_Color',
		});
		RocketChat.settings.add(`SAML_Custom_${ name }_button_color`, '#13679A', {
			type: 'string',
			group: 'SAML',
			section: name,
			i18nLabel: 'Accounts_OAuth_Custom_Button_Color',
		});
		RocketChat.settings.add(`SAML_Custom_${ name }_generate_username`, false, {
			type: 'boolean',
			group: 'SAML',
			section: name,
			i18nLabel: 'SAML_Custom_Generate_Username',
		});
		RocketChat.settings.add(`SAML_Custom_${ name }_debug`, false, {
			type: 'boolean',
			group: 'SAML',
			section: name,
			i18nLabel: 'SAML_Custom_Debug',
		});
		RocketChat.settings.add(`SAML_Custom_${ name }_logout_behaviour`, 'SAML', {
			type: 'select',
			values: [
				{ key: 'SAML', i18nLabel: 'SAML_Custom_Logout_Behaviour_Terminate_SAML_Session' },
				{ key: 'Local', i18nLabel: 'SAML_Custom_Logout_Behaviour_End_Only_RocketChat' },
			],
			group: 'SAML',
			section: name,
			i18nLabel: 'SAML_Custom_Logout_Behaviour',
		});
	},
});

const getSamlConfigs = function(service) {
	return {
		buttonLabelText: RocketChat.settings.get(`${ service.key }_button_label_text`),
		buttonLabelColor: RocketChat.settings.get(`${ service.key }_button_label_color`),
		buttonColor: RocketChat.settings.get(`${ service.key }_button_color`),
		clientConfig: {
			provider: RocketChat.settings.get(`${ service.key }_provider`),
		},
		entryPoint: RocketChat.settings.get(`${ service.key }_entry_point`),
		idpSLORedirectURL: RocketChat.settings.get(`${ service.key }_idp_slo_redirect_url`),
		generateUsername: RocketChat.settings.get(`${ service.key }_generate_username`),
		debug: RocketChat.settings.get(`${ service.key }_debug`),
		issuer: RocketChat.settings.get(`${ service.key }_issuer`),
		logoutBehaviour: RocketChat.settings.get(`${ service.key }_logout_behaviour`),
		secret: {
			privateKey: RocketChat.settings.get(`${ service.key }_private_key`),
			publicCert: RocketChat.settings.get(`${ service.key }_public_cert`),
			cert: RocketChat.settings.get(`${ service.key }_cert`),
		},
	};
};

const debounce = (fn, delay) => {
	let timer = null;
	return () => {
		if (timer != null) {
			Meteor.clearTimeout(timer);
		}
		return timer = Meteor.setTimeout(fn, delay);
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
	Accounts.saml.settings.debug = samlConfigs.debug;

	return {
		provider: samlConfigs.clientConfig.provider,
		entryPoint: samlConfigs.entryPoint,
		idpSLORedirectURL: samlConfigs.idpSLORedirectURL,
		issuer: samlConfigs.issuer,
		cert: samlConfigs.secret.cert,
		privateCert,
		privateKey,
	};
};

const updateServices = debounce(() => {
	const services = RocketChat.settings.get(/^(SAML_Custom_)[a-z]+$/i);
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


RocketChat.settings.get(/^SAML_.+/, updateServices);

Meteor.startup(() => Meteor.call('addSamlService', 'Default'));

export {
	updateServices,
	configureSamlService,
	getSamlConfigs,
	debounce,
	logger,
};
