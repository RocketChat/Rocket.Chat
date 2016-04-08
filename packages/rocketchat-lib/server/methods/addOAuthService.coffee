Meteor.methods
	addOAuthService: (name) ->
		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] addOAuthService -> Invalid user")

		unless RocketChat.authz.hasPermission( Meteor.userId(), 'add-oauth-service') is true
			throw new Meteor.Error 'not-authorized', '[methods] addOAuthService -> Not authorized'

		name = name.toLowerCase().replace(/[^a-z0-9]/g, '')
		name = s.capitalize(name)
		RocketChat.settings.add "Accounts_OAuth_Custom_#{name}"                           , false             , { type: 'boolean', group: 'OAuth', section: "Custom OAuth: #{name}", i18nLabel: 'Accounts_OAuth_Custom_Enable', persistent: true }
		RocketChat.settings.add "Accounts_OAuth_Custom_#{name}_url"                       , ''                , { type: 'string' , group: 'OAuth', section: "Custom OAuth: #{name}", i18nLabel: 'Accounts_OAuth_Custom_URL', persistent: true }
		RocketChat.settings.add "Accounts_OAuth_Custom_#{name}_token_path"                , '/oauth/token'    , { type: 'string' , group: 'OAuth', section: "Custom OAuth: #{name}", i18nLabel: 'Accounts_OAuth_Custom_Token_Path', persistent: true }
		RocketChat.settings.add "Accounts_OAuth_Custom_#{name}_identity_path"             , '/me'             , { type: 'string' , group: 'OAuth', section: "Custom OAuth: #{name}", i18nLabel: 'Accounts_OAuth_Custom_Identity_Path', persistent: true }
		RocketChat.settings.add "Accounts_OAuth_Custom_#{name}_authorize_path"            , '/oauth/authorize', { type: 'string' , group: 'OAuth', section: "Custom OAuth: #{name}", i18nLabel: 'Accounts_OAuth_Custom_Authorize_Path', persistent: true }
		RocketChat.settings.add "Accounts_OAuth_Custom_#{name}_token_sent_via"            , 'payload'         , { type: 'select' , group: 'OAuth', section: "Custom OAuth: #{name}", i18nLabel: 'Accounts_OAuth_Custom_Token_Sent_Via', persistent: true, values: [ { key: 'header', i18nLabel: 'Header' }, { key: 'payload', i18nLabel: 'Payload' } ] }
		RocketChat.settings.add "Accounts_OAuth_Custom_#{name}_id"                        , ''                , { type: 'string' , group: 'OAuth', section: "Custom OAuth: #{name}", i18nLabel: 'Accounts_OAuth_Custom_id', persistent: true }
		RocketChat.settings.add "Accounts_OAuth_Custom_#{name}_secret"                    , ''                , { type: 'string' , group: 'OAuth', section: "Custom OAuth: #{name}", i18nLabel: 'Accounts_OAuth_Custom_Secret', persistent: true }
		RocketChat.settings.add "Accounts_OAuth_Custom_#{name}_login_style"               , 'popup'           , { type: 'select' , group: 'OAuth', section: "Custom OAuth: #{name}", i18nLabel: 'Accounts_OAuth_Custom_Login_Style', persistent: true, values: [ { key: 'redirect', i18nLabel: 'Redirect' }, { key: 'popup', i18nLabel: 'Popup' }, { key: '', i18nLabel: 'Default' } ] }
		RocketChat.settings.add "Accounts_OAuth_Custom_#{name}_button_label_text"         , ''                , { type: 'string' , group: 'OAuth', section: "Custom OAuth: #{name}", i18nLabel: 'Accounts_OAuth_Custom_Button_Label_Text', persistent: true }
		RocketChat.settings.add "Accounts_OAuth_Custom_#{name}_button_label_color"        , '#FFFFFF'         , { type: 'string' , group: 'OAuth', section: "Custom OAuth: #{name}", i18nLabel: 'Accounts_OAuth_Custom_Button_Label_Color', persistent: true }
		RocketChat.settings.add "Accounts_OAuth_Custom_#{name}_button_color"              , '#13679A'         , { type: 'string' , group: 'OAuth', section: "Custom OAuth: #{name}", i18nLabel: 'Accounts_OAuth_Custom_Button_Color', persistent: true }
