Meteor.startup ->
	Migrations.add
		version: 8
		up: ->
			console.log 'Load old settings record'
			settings = Settings.findOne({ _id: 'settings' })
			if settings
				Settings.insert { _id: 'CDN_PREFIX', value: settings.CDN_PREFIX, type: 'string', group: 'General' } if settings.CDN_PREFIX?
				Settings.insert { _id: 'MAIL_URL', value: settings.ENV.MAIL_URL, type: 'string', group: 'SMTP' } if settings.ENV?.MAIL_URL?
				Settings.insert { _id: 'Accounts_denyUnverifiedEmails', value: settings.denyUnverifiedEmails, type: 'boolean', group: 'Accounts' } if settings.denyUnverifiedEmails?
				Settings.insert { _id: 'KADIRA_APP_ID', value: settings.kadira.appId, type: 'string', group: 'API' } if settings.kadira?.appId?
				Settings.insert { _id: 'KADIRA_APP_SECRET', value: settings.kadira.appSecret, type: 'string', group: 'API' } if settings.kadira?.appSecret?
				Settings.insert { _id: 'avatarStore_type', value: settings.public.avatarStore.type, type: 'string', group: 'API' } if settings.public?.avatarStore?.type?
				Settings.insert { _id: 'avatarStore_path', value: settings.public.avatarStore.path, type: 'string', group: 'API' } if settings.public?.avatarStore?.path?
				Settings.remove { _id: 'settings' }