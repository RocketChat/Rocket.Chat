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

timer = undefined
updateServices = ->
	Meteor.clearTimeout timer if timer?

	timer = Meteor.setTimeout ->
		services = Settings.find({_id: /^(SAML_Custom_)[a-z]+$/i}).fetch()

		Accounts.saml.settings.providers = []

		for service in services
			console.log "Updating login service #{service._id}".blue

			serviceName = 'saml'

			if service.value is true
				data =
					buttonLabelText: Settings.findOne({_id: "#{service._id}_button_label_text"})?.value
					buttonLabelColor: Settings.findOne({_id: "#{service._id}_button_label_color"})?.value
					buttonColor: Settings.findOne({_id: "#{service._id}_button_color"})?.value
					clientConfig:
						provider: Settings.findOne({_id: "#{service._id}_provider"})?.value

				Accounts.saml.settings.providers.push
					provider: data.clientConfig.provider
					entryPoint: Settings.findOne({_id: "#{service._id}_entry_point"})?.value
					issuer: Settings.findOne({_id: "#{service._id}_issuer"})?.value
					cert: Settings.findOne({_id: "#{service._id}_cert"})?.value

				ServiceConfiguration.configurations.upsert {service: serviceName.toLowerCase()}, $set: data
			else
				ServiceConfiguration.configurations.remove {service: serviceName.toLowerCase()}
	, 2000

Settings.find().observe
	added: (record) ->
		if /^SAML_.+/.test record._id
			updateServices()

	changed: (record) ->
		if /^SAML_.+/.test record._id
			updateServices()

	removed: (record) ->
		if /^SAML_.+/.test record._id
			updateServices()

Meteor.startup ->
	if not Settings.findOne({_id: /^(SAML_Custom)[a-z]+$/i})?
		Meteor.call 'addSamlService', 'default'