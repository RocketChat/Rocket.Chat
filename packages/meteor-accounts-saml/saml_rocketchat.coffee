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
		RocketChat.settings.add "SAML_Custom_#{name}_public_cert_file_path"  , 'filename.crt'                                           , { type: 'string' , group: 'SAML', section: name, i18nLabel: 'SAML_Custom_Public_Cert_File_Path'}
		RocketChat.settings.add "SAML_Custom_#{name}_private_key_file_path"  , 'filename.key'                                           , { type: 'string' , group: 'SAML', section: name, i18nLabel: 'SAML_Custom_Private_Key_File_Path'}
		RocketChat.settings.add "SAML_Custom_#{name}_button_label_text" , ''                                                            , { type: 'string' , group: 'SAML', section: name, i18nLabel: 'Accounts_OAuth_Custom_Button_Label_Text'}
		RocketChat.settings.add "SAML_Custom_#{name}_button_label_color", '#FFFFFF'                                                     , { type: 'string' , group: 'SAML', section: name, i18nLabel: 'Accounts_OAuth_Custom_Button_Label_Color'}
		RocketChat.settings.add "SAML_Custom_#{name}_button_color"      , '#13679A'                                                     , { type: 'string' , group: 'SAML', section: name, i18nLabel: 'Accounts_OAuth_Custom_Button_Color'}
		RocketChat.settings.add "SAML_Custom_#{name}_generate_username" , false                                                         , { type: 'boolean', group: 'SAML', section: name, i18nLabel: 'SAML_Custom_Generate_Username'}

timer = undefined

# Find existing SAML providers (idp's) in in RocketChat settings
# (instances of RocketChat.models.Settings) and update the system.
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
			logger.updated service.key

			serviceName = 'saml'

			if service.value is true
				data =
					buttonLabelText: RocketChat.settings.get("#{service.key}_button_label_text")
					buttonLabelColor: RocketChat.settings.get("#{service.key}_button_label_color")
					buttonColor: RocketChat.settings.get("#{service.key}_button_color")
					clientConfig:
						provider: RocketChat.settings.get("#{service.key}_provider")

				Accounts.saml.settings.generateUsername = RocketChat.settings.get("#{service._id}_generate_username")
				privateKeyFilePath = RocketChat.settings.get("#{service._id}_private_key_file_path")
				publicCertFilePath = RocketChat.settings.get("#{service._id}_public_cert_file_path")

				try
					privateKey = fs.readFileSync(privateKeyFilePath).toString()
					privateCert = fs.readFileSync(publicCertFilePath).toString()
				catch err
					console.warn "Can't configure key or cert for SAML, signing and encryption will not work"
					console.warn "Error was: #{err.message}"
					privateKey = false
					privateCert = false

				Accounts.saml.settings.providers.push
					provider: data.clientConfig.provider
					entryPoint: RocketChat.settings.get("#{service.key}_entry_point")
					issuer: RocketChat.settings.get("#{service.key}_issuer")
					cert: RocketChat.settings.get("#{service.key}_cert")
					privateCert: privateCert
					privateKey: privateKey

				ServiceConfiguration.configurations.upsert {service: serviceName.toLowerCase()}, $set: data
			else
				ServiceConfiguration.configurations.remove {service: serviceName.toLowerCase()}
	, 2000

RocketChat.settings.get /^SAML_.+/, (key, value) ->
	updateServices()

Meteor.startup ->
	# Create a Default provider if no providers are found.
	if RocketChat.settings.get(/^(SAML_Custom)_[a-z]+$/i)?.length is 0
		Meteor.call 'addSamlService', 'Default'
