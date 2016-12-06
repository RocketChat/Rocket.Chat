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
		RocketChat.settings.add "SAML_Custom_#{name}"                   , false                                                         , { type: 'boolean', group: 'SAML', section: name, i18nLabel: 'Accounts_OAuth_Custom_Enable'}
		RocketChat.settings.add "SAML_Custom_#{name}_provider"          , 'openidp'                                                     , { type: 'string' , group: 'SAML', section: name, i18nLabel: 'SAML_Custom_Provider'}
		RocketChat.settings.add "SAML_Custom_#{name}_entry_point"       , 'https://openidp.feide.no/simplesaml/saml2/idp/SSOService.php', { type: 'string' , group: 'SAML', section: name, i18nLabel: 'SAML_Custom_Entry_point'}
		RocketChat.settings.add "SAML_Custom_#{name}_issuer"            , 'https://rocket.chat/'                                        , { type: 'string' , group: 'SAML', section: name, i18nLabel: 'SAML_Custom_Issuer'}
		RocketChat.settings.add "SAML_Custom_#{name}_cert"              , ''                                                            , { type: 'string' , group: 'SAML', section: name, i18nLabel: 'SAML_Custom_Cert'}
		RocketChat.settings.add "SAML_Custom_#{name}_public_cert_file_path", '', {
			type: 'string' ,
			group: 'SAML',
			section: name,
			i18nLabel: 'SAML_Custom_Public_Cert_File_Path',
			i18nDescription: 'SAML_Custom_Public_Cert_File_Path_Description'
		}
		RocketChat.settings.add "SAML_Custom_#{name}_private_key_file_path", '', {
			type: 'string' ,
			group: 'SAML',
			section: name,
			i18nLabel: 'SAML_Custom_Private_Key_File_Path',
			i18nDescription: 'SAML_Custom_Private_Key_File_Path_Description'
		}
		RocketChat.settings.add "SAML_Custom_#{name}_button_label_text" , ''																														, { type: 'string' , group: 'SAML', section: name, i18nLabel: 'Accounts_OAuth_Custom_Button_Label_Text'}
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
	privateKeyFilePath: RocketChat.settings.get("#{service.key}_private_key_file_path")
	publicCertFilePath: RocketChat.settings.get("#{service.key}_public_cert_file_path")
	entryPoint: RocketChat.settings.get("#{service.key}_entry_point")
	issuer: RocketChat.settings.get("#{service.key}_issuer")
	cert: RocketChat.settings.get("#{service.key}_cert")
	generateUsername: RocketChat.settings.get("#{service.key}_generate_username")

# Configure Meteor SAML.
#
# Get private key for signing and update Accounts.saml.settings.
# Meteor saml package uses Accounts.saml.settings.

configureSamlService = (samlConfigs) ->
	privateKey = false
	privateCert = false
	if samlConfigs.privateKeyFilePath and samlConfigs.publicCertFilePath
		try
			privateKey = fs.readFileSync(samlConfigs.privateKeyFilePath).toString()
			privateCert = fs.readFileSync(samlConfigs.publicCertFilePath).toString()
			logger.info "Successfully loaded public cert and private key files for SAML."
		catch err
			logger.error "Can't configure key or cert for SAML, signing will not be performed by RocketChat."
			logger.error "Error was: #{err.message}"
	else
		if samlConfigs.privateKeyFilePath or samlConfigs.publicCertFilePath
			logger.error "You must specify both cert and key files."
			privateKey = false
			privateCert = false
	Accounts.saml.settings.generateUsername = samlConfigs.generateUsername
	Accounts.saml.settings.providers.push
		provider: samlConfigs.clientConfig.provider
		entryPoint: samlConfigs.entryPoint
		issuer: samlConfigs.issuer
		cert: samlConfigs.cert
		privateCert: privateCert
		privateKey: privateKey

RocketChat.settings.get /^SAML_.+/, (key, value) ->
	updateServices()

Meteor.startup ->
	# Create a Default provider if no providers are found.
	if RocketChat.settings.get(/^(SAML_Custom)_[a-z]+$/i)?.length is 0
		Meteor.call 'addSamlService', 'Default'
