Meteor.methods
	removeOAuthService: (name) ->
		if not Meteor.userId()
			throw new Meteor.Error('error-invalid-user', "Invalid user", { method: 'removeOAuthService' })

		unless RocketChat.authz.hasPermission( Meteor.userId(), 'add-oauth-service') is true
			throw new Meteor.Error 'error-not-allowed', 'Not allowed', { method: 'removeOAuthService' }

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
