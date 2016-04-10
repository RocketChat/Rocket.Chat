Meteor.methods
	removeOAuthService: (name) ->
		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] removeOAuthService -> Invalid user")

		unless RocketChat.authz.hasPermission( Meteor.userId(), 'add-oauth-service') is true
			throw new Meteor.Error 'not-authorized', '[methods] removeOAuthService -> Not authorized'

		name = name.toLowerCase().replace(/[^a-z0-9]/g, '')
		name = s.capitalize(name)
		RocketChat.settings.removeById "Accounts_OAuth_Custom_#{name}"
		RocketChat.settings.removeById "Accounts_OAuth_Custom_#{name}_url"
		RocketChat.settings.removeById "Accounts_OAuth_Custom_#{name}_token_path"
		RocketChat.settings.removeById "Accounts_OAuth_Custom_#{name}_identity_path"
		RocketChat.settings.removeById "Accounts_OAuth_Custom_#{name}_authorize_path"
		RocketChat.settings.removeById "Accounts_OAuth_Custom_#{name}_token_sent_via"
		RocketChat.settings.removeById "Accounts_OAuth_Custom_#{name}_id"
		RocketChat.settings.removeById "Accounts_OAuth_Custom_#{name}_secret"
		RocketChat.settings.removeById "Accounts_OAuth_Custom_#{name}_button_label_text"
		RocketChat.settings.removeById "Accounts_OAuth_Custom_#{name}_button_label_color"
		RocketChat.settings.removeById "Accounts_OAuth_Custom_#{name}_button_color"
		RocketChat.settings.removeById "Accounts_OAuth_Custom_#{name}_login_style"
