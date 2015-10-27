Meteor.methods
	addOAuthService: (name) ->
		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] addOAuthService -> Invalid user")

		console.log '[methods] addOAuthService -> '.green, 'userId:', Meteor.userId(), 'arguments:', arguments

		unless RocketChat.authz.hasPermission( Meteor.userId(), 'add-oauth-service') is true
			throw new Meteor.Error 'not-authorized', '[methods] addOAuthService -> Not authorized'

		name = name.toLowerCase().replace(/[^a-z0-9]/g, '')
		name = s.capitalize(name)
		RocketChat.settings.add "Accounts_OAuth_Custom_#{name}"                   , false             , { type: 'boolean', group: 'Accounts', section: "Custom OAuth: #{name}", i18nLabel: 'Accounts_OAuth_Custom_Enable'}
		RocketChat.settings.add "Accounts_OAuth_Custom_#{name}_url"               , ''                , { type: 'string' , group: 'Accounts', section: "Custom OAuth: #{name}", i18nLabel: 'Accounts_OAuth_Custom_URL'}
		RocketChat.settings.add "Accounts_OAuth_Custom_#{name}_token_path"        , '/oauth/token'    , { type: 'string' , group: 'Accounts', section: "Custom OAuth: #{name}", i18nLabel: 'Accounts_OAuth_Custom_Token_Path'}
		RocketChat.settings.add "Accounts_OAuth_Custom_#{name}_identity_path"     , '/me'             , { type: 'string' , group: 'Accounts', section: "Custom OAuth: #{name}", i18nLabel: 'Accounts_OAuth_Custom_Identity_Path'}
		RocketChat.settings.add "Accounts_OAuth_Custom_#{name}_authorize_path"    , '/oauth/authorize', { type: 'string' , group: 'Accounts', section: "Custom OAuth: #{name}", i18nLabel: 'Accounts_OAuth_Custom_Authorize_Path'}
		RocketChat.settings.add "Accounts_OAuth_Custom_#{name}_id"                , ''                , { type: 'string' , group: 'Accounts', section: "Custom OAuth: #{name}", i18nLabel: 'Accounts_OAuth_Custom_id'}
		RocketChat.settings.add "Accounts_OAuth_Custom_#{name}_secret"            , ''                , { type: 'string' , group: 'Accounts', section: "Custom OAuth: #{name}", i18nLabel: 'Accounts_OAuth_Custom_Secret'}
		RocketChat.settings.add "Accounts_OAuth_Custom_#{name}_button_label_text" , ''                , { type: 'string' , group: 'Accounts', section: "Custom OAuth: #{name}", i18nLabel: 'Accounts_OAuth_Custom_Button_Label_Text'}
		RocketChat.settings.add "Accounts_OAuth_Custom_#{name}_button_label_color", '#FFFFFF'         , { type: 'string' , group: 'Accounts', section: "Custom OAuth: #{name}", i18nLabel: 'Accounts_OAuth_Custom_Button_Label_Color'}
		RocketChat.settings.add "Accounts_OAuth_Custom_#{name}_button_color"      , '#13679A'         , { type: 'string' , group: 'Accounts', section: "Custom OAuth: #{name}", i18nLabel: 'Accounts_OAuth_Custom_Button_Color'}

	removeOAuthService: (name) ->
		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] addOAuthService -> Invalid user")

		console.log '[methods] addOAuthService -> '.green, 'userId:', Meteor.userId(), 'arguments:', arguments

		unless RocketChat.authz.hasPermission( Meteor.userId(), 'add-oauth-service') is true
			throw new Meteor.Error 'not-authorized', '[methods] addOAuthService -> Not authorized'

		name = name.toLowerCase().replace(/[^a-z0-9]/g, '')
		name = s.capitalize(name)
		RocketChat.settings.removeById "Accounts_OAuth_Custom_#{name}"
		RocketChat.settings.removeById "Accounts_OAuth_Custom_#{name}_url"
		RocketChat.settings.removeById "Accounts_OAuth_Custom_#{name}_token_path"
		RocketChat.settings.removeById "Accounts_OAuth_Custom_#{name}_identity_path"
		RocketChat.settings.removeById "Accounts_OAuth_Custom_#{name}_authorize_path"
		RocketChat.settings.removeById "Accounts_OAuth_Custom_#{name}_id"
		RocketChat.settings.removeById "Accounts_OAuth_Custom_#{name}_secret"
		RocketChat.settings.removeById "Accounts_OAuth_Custom_#{name}_button_label_text"
		RocketChat.settings.removeById "Accounts_OAuth_Custom_#{name}_button_label_color"
		RocketChat.settings.removeById "Accounts_OAuth_Custom_#{name}_button_color"
