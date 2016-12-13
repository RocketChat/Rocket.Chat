fs = Npm.require('fs')

logger = new Logger 'steffo:meteor-accounts-saml',
	methods:
		updated:
			type: 'info'

RocketChat.settings.addGroup 'SAML'
Meteor.methods

  # Define configuration settings for each provider (name) in the
  # admin SAML form.

	addSamlService: (name) ->
		RocketChat.settings.add "SAML_Custom_#{name}"                      , false                                                             , { type: 'boolean', group: 'SAML', section: name, i18nLabel: 'Accounts_OAuth_Custom_Enable'}
		RocketChat.settings.add "SAML_Custom_#{name}_provider"             , 'provider-name'                                                   , { type: 'string' , group: 'SAML', section: name, i18nLabel: 'SAML_Custom_Provider'}
		RocketChat.settings.add "SAML_Custom_#{name}_entry_point"          , 'https://example.com/simplesaml/saml2/idp/SSOService.php'         , { type: 'string' , group: 'SAML', section: name, i18nLabel: 'SAML_Custom_Entry_point'}
		RocketChat.settings.add "SAML_Custom_#{name}_idp_slo_redirect_url" , 'https://example.com/simplesaml/saml2/idp/SingleLogoutService.php', { type: 'string' , group: 'SAML', section: name, i18nLabel: 'SAML_Custom_IDP_SLO_Redirect_URL'}
		RocketChat.settings.add "SAML_Custom_#{name}_issuer"               , 'https://your-rocket-chat/_saml/metadata/provider-name'           , { type: 'string' , group: 'SAML', section: name, i18nLabel: 'SAML_Custom_Issuer'}
		RocketChat.settings.add "SAML_Custom_#{name}_cert"                 , ''                                                                , { type: 'string' , group: 'SAML', section: name, i18nLabel: 'SAML_Custom_Cert', multiline: true}
		RocketChat.settings.add "SAML_Custom_#{name}_public_cert", '', {
			type: 'string' ,
			group: 'SAML',
			section: name,
			multiline: true,
			i18nLabel: 'SAML_Custom_Public_Cert'
		}
		RocketChat.settings.add "SAML_Custom_#{name}_private_key", '', {
			type: 'string' ,
			group: 'SAML',
			section: name,
			multiline: true,
			i18nLabel: 'SAML_Custom_Private_Key'
		}
		RocketChat.settings.add "SAML_Custom_#{name}_button_label_text" , ''                                                            , { type: 'string' , group: 'SAML', section: name, i18nLabel: 'Accounts_OAuth_Custom_Button_Label_Text'}
		RocketChat.settings.add "SAML_Custom_#{name}_button_label_color", '#FFFFFF'                                                     , { type: 'string' , group: 'SAML', section: name, i18nLabel: 'Accounts_OAuth_Custom_Button_Label_Color'}
		RocketChat.settings.add "SAML_Custom_#{name}_button_color"      , '#13679A'                                                     , { type: 'string' , group: 'SAML', section: name, i18nLabel: 'Accounts_OAuth_Custom_Button_Color'}
		RocketChat.settings.add "SAML_Custom_#{name}_generate_username" , false                                                         , { type: 'boolean', group: 'SAML', section: name, i18nLabel: 'SAML_Custom_Generate_Username'}

timer = undefined

# Find existing SAML services (idp's) in RocketChat settings and
# update the system.
#
# Updating the system includes:
# 1) Appending enabled providers to Accounts.saml.settings.providers.
# 2) Appending enabled providers to ServiceConfiguration.configurations.
# 3) Removing disabled providers from ServiceConfiguration.configurations.

updateServices = ->
	Meteor.clearTimeout timer if timer?
	timer = Meteor.setTimeout ->
		services = RocketChat.settings.get(/^(SAML_Custom_)[a-z]+$/i)
		Accounts.saml.settings.providers = []
		for service in services
			serviceName = 'saml'
			if service.value is true
				samlConfigs = getSamlConfigs(service)
				configureSamlService(samlConfigs)
				ServiceConfiguration.configurations.upsert {service: serviceName.toLowerCase()}, $set: samlConfigs
			else
				ServiceConfiguration.configurations.remove {service: serviceName.toLowerCase()}
			logger.updated service.key
	, 2000

# Fetch config settings from RocketChat for a given SAML service "SAML_Custom_<name>".

getSamlConfigs = (service) ->
	buttonLabelText: RocketChat.settings.get("#{service.key}_button_label_text")
	buttonLabelColor: RocketChat.settings.get("#{service.key}_button_label_color")
	buttonColor: RocketChat.settings.get("#{service.key}_button_color")
	clientConfig:
		provider: RocketChat.settings.get("#{service.key}_provider")
	entryPoint: RocketChat.settings.get("#{service.key}_entry_point")
	idpSLORedirectURL: RocketChat.settings.get("#{service.key}_idp_slo_redirect_url")
	generateUsername: RocketChat.settings.get("#{service.key}_generate_username")
	issuer: RocketChat.settings.get("#{service.key}_issuer")
	secret:
		privateKey: RocketChat.settings.get("#{service.key}_private_key")
		publicCert: RocketChat.settings.get("#{service.key}_public_cert")
		cert: RocketChat.settings.get("#{service.key}_cert")

# Configure Meteor SAML.
#
# Get private key for signing and update Accounts.saml.settings.
# Meteor saml package uses Accounts.saml.settings.

configureSamlService = (samlConfigs) ->
	privateKey = false
	privateCert = false
	if samlConfigs.secret.privateKey and samlConfigs.secret.publicCert
		privateKey = samlConfigs.secret.privateKey
		privateCert = samlConfigs.secret.publicCert
	else
		if samlConfigs.secret.privateKey or samlConfigs.secret.publicCert
			logger.error "You must specify both cert and key files."
			privateKey = false
			privateCert = false
	Accounts.saml.settings.generateUsername = samlConfigs.generateUsername
	Accounts.saml.settings.providers.push
		provider: samlConfigs.clientConfig.provider
		entryPoint: samlConfigs.entryPoint
		idpSLORedirectURL: samlConfigs.idpSLORedirectURL
		issuer: samlConfigs.issuer
		cert: samlConfigs.secret.cert
		privateCert: privateCert
		privateKey: privateKey

RocketChat.settings.get /^SAML_.+/, (key, value) ->
	updateServices()

Meteor.startup ->
	Meteor.call 'addSamlService', 'Default'
