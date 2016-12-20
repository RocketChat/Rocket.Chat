logger = new Logger 'rocketchat:lib',
	methods:
		oauth_updated:
			type: 'info'

timer = undefined
OAuthServicesUpdate = ->
	Meteor.clearTimeout timer if timer?

	timer = Meteor.setTimeout ->
		services = RocketChat.settings.get(/^(Accounts_OAuth_|Accounts_OAuth_Custom-)[a-z0-9_]+$/i)
		for service in services
			logger.oauth_updated service.key

			serviceName = service.key.replace('Accounts_OAuth_', '')
			if serviceName is 'Meteor'
				serviceName = 'meteor-developer'

			if /Accounts_OAuth_Custom-/.test service.key
				serviceName = service.key.replace('Accounts_OAuth_Custom-', '')

			if service.value is true
				data =
					clientId: RocketChat.settings.get("#{service.key}_id")
					secret: RocketChat.settings.get("#{service.key}_secret")


				if /Accounts_OAuth_Custom-/.test service.key
					data.custom = true
					data.clientId = RocketChat.settings.get("#{service.key}-id")
					data.secret = RocketChat.settings.get("#{service.key}-secret")
					data.serverURL = RocketChat.settings.get("#{service.key}-url")
					data.tokenPath = RocketChat.settings.get("#{service.key}-token_path")
					data.identityPath = RocketChat.settings.get("#{service.key}-identity_path")
					data.authorizePath = RocketChat.settings.get("#{service.key}-authorize_path")
					data.scope = RocketChat.settings.get("#{service.key}-scope")
					data.buttonLabelText = RocketChat.settings.get("#{service.key}-button_label_text")
					data.buttonLabelColor = RocketChat.settings.get("#{service.key}-button_label_color")
					data.loginStyle = RocketChat.settings.get("#{service.key}-login_style")
					data.buttonColor = RocketChat.settings.get("#{service.key}-button_color")
					data.tokenSentVia = RocketChat.settings.get("#{service.key}-token_sent_via")
					data.usernameField = RocketChat.settings.get("#{service.key}-username_field")
					data.mergeUsers = RocketChat.settings.get("#{service.key}-merge_users")
					new CustomOAuth serviceName.toLowerCase(),
						serverURL: data.serverURL
						tokenPath: data.tokenPath
						identityPath: data.identityPath
						authorizePath: data.authorizePath
						scope: data.scope
						loginStyle: data.loginStyle
						tokenSentVia: data.tokenSentVia
						usernameField: data.usernameField
						mergeUsers: data.mergeUsers

				if serviceName is 'Facebook'
					data.appId = data.clientId
					delete data.clientId

				if serviceName is 'Twitter'
					data.consumerKey = data.clientId
					delete data.clientId
				ServiceConfiguration.configurations.upsert {service: serviceName.toLowerCase()}, $set: data
			else
				ServiceConfiguration.configurations.remove {service: serviceName.toLowerCase()}
	, 2000


OAuthServicesRemove = (_id) ->
	serviceName = _id.replace('Accounts_OAuth_Custom-', '')
	ServiceConfiguration.configurations.remove {service: serviceName.toLowerCase()}


RocketChat.settings.get /^Accounts_OAuth_.+/, (key, value) ->
		OAuthServicesUpdate()

RocketChat.settings.get /^Accounts_OAuth_Custom-[a-z0-9_]+/, (key, value) ->
	if not value
		OAuthServicesRemove key
