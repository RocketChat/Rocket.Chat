logger = new Logger 'steffo:meteor-accounts-saml',
	methods:
		updated:
			type: 'info'

RocketChat.settings.addGroup 'SAML'
Meteor.methods
	addSamlService: (name) ->
		RocketChat.settings.add "SAML_Custom_#{name}"                   , false                                                         , { type: 'boolean', group: 'SAML', section: name, i18nLabel: 'Accounts_OAuth_Custom_Enable'}
		RocketChat.settings.add "SAML_Custom_#{name}_provider"          , 'openidp'                                                     , { type: 'string' , group: 'SAML', section: name, i18nLabel: 'SAML_Custom_Provider'}
		RocketChat.settings.add "SAML_Custom_#{name}_entry_point"       , 'https://openidp.feide.no/simplesaml/saml2/idp/SSOService.php', { type: 'string' , group: 'SAML', section: name, i18nLabel: 'SAML_Custom_Entry_point'}
		RocketChat.settings.add "SAML_Custom_#{name}_issuer"            , 'https://rocket.chat/'                                        , { type: 'string' , group: 'SAML', section: name, i18nLabel: 'SAML_Custom_Issuer'}
		RocketChat.settings.add "SAML_Custom_#{name}_cert"              , ''                                                            , { type: 'string' , group: 'SAML', section: name, i18nLabel: 'SAML_Custom_Cert'}
		RocketChat.settings.add "SAML_Custom_#{name}_button_label_text" , ''                                                            , { type: 'string' , group: 'SAML', section: name, i18nLabel: 'Accounts_OAuth_Custom_Button_Label_Text'}
		RocketChat.settings.add "SAML_Custom_#{name}_button_label_color", '#FFFFFF'                                                     , { type: 'string' , group: 'SAML', section: name, i18nLabel: 'Accounts_OAuth_Custom_Button_Label_Color'}
		RocketChat.settings.add "SAML_Custom_#{name}_button_color"      , '#13679A'                                                     , { type: 'string' , group: 'SAML', section: name, i18nLabel: 'Accounts_OAuth_Custom_Button_Color'}
		RocketChat.settings.add "SAML_Custom_#{name}_generate_username" , false                                                         , { type: 'boolean', group: 'SAML', section: name, i18nLabel: 'SAML_Custom_Generate_Username'}

timer = undefined
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

				Accounts.saml.settings.generateUsername = RocketChat.settings.get("#{service.key}_generate_username")

				Accounts.saml.settings.providers.push
					provider: data.clientConfig.provider
					entryPoint: RocketChat.settings.get("#{service.key}_entry_point")
					issuer: RocketChat.settings.get("#{service.key}_issuer")
					cert: RocketChat.settings.get("#{service.key}_cert")

				ServiceConfiguration.configurations.upsert {service: serviceName.toLowerCase()}, $set: data
			else
				ServiceConfiguration.configurations.remove {service: serviceName.toLowerCase()}
	, 2000

RocketChat.settings.get /^SAML_.+/, (key, value) ->
	updateServices()

Meteor.startup ->
	if RocketChat.settings.get(/^(SAML_Custom)_[a-z]+$/i)?.length is 0
		Meteor.call 'addSamlService', 'Default'
