Meteor.methods
	addOAuthService: (name) ->
		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] addOAuthService -> Invalid user")

		console.log '[methods] addOAuthService -> '.green, 'userId:', Meteor.userId(), 'arguments:', arguments

		unless Meteor.user()?.admin is true
			throw new Meteor.Error 'not-authorized', '[methods] addOAuthService -> Not authorized'

		name = s.capitalize(name)
		RocketChat.settings.add "Accounts_OAuth_Custom_#{name}"                   , false             , { type: 'boolean', group: 'Accounts', section: name, i18nLabel: 'Accounts_OAuth_Custom_Enable'}
		RocketChat.settings.add "Accounts_OAuth_Custom_#{name}_url"               , ''                , { type: 'string' , group: 'Accounts', section: name, i18nLabel: 'Accounts_OAuth_Custom_URL'}
		RocketChat.settings.add "Accounts_OAuth_Custom_#{name}_token_path"        , '/oauth/token'    , { type: 'string' , group: 'Accounts', section: name, i18nLabel: 'Accounts_OAuth_Custom_Token_Path'}
		RocketChat.settings.add "Accounts_OAuth_Custom_#{name}_identity_path"     , '/me'             , { type: 'string' , group: 'Accounts', section: name, i18nLabel: 'Accounts_OAuth_Custom_Identity_Path'}
		RocketChat.settings.add "Accounts_OAuth_Custom_#{name}_authorize_path"    , '/oauth/authorize', { type: 'string' , group: 'Accounts', section: name, i18nLabel: 'Accounts_OAuth_Custom_Authorize_Path'}
		RocketChat.settings.add "Accounts_OAuth_Custom_#{name}_id"                , ''                , { type: 'string' , group: 'Accounts', section: name, i18nLabel: 'Accounts_OAuth_Custom_ID'}
		RocketChat.settings.add "Accounts_OAuth_Custom_#{name}_secret"            , ''                , { type: 'string' , group: 'Accounts', section: name, i18nLabel: 'Accounts_OAuth_Custom_Secret'}
		RocketChat.settings.add "Accounts_OAuth_Custom_#{name}_button_label_text" , ''                , { type: 'string' , group: 'Accounts', section: name, i18nLabel: 'Accounts_OAuth_Custom_Button_Label_Text'}
		RocketChat.settings.add "Accounts_OAuth_Custom_#{name}_button_label_color", '#FFFFFF'         , { type: 'string' , group: 'Accounts', section: name, i18nLabel: 'Accounts_OAuth_Custom_Button_Label_Color'}
		RocketChat.settings.add "Accounts_OAuth_Custom_#{name}_button_color"      , '#13679A'         , { type: 'string' , group: 'Accounts', section: name, i18nLabel: 'Accounts_OAuth_Custom_Button_Color'}
