Meteor.startup ->
	Migrations.add
		version: 8
		up: ->
			console.log 'Add default settings'
			
			# Accounts
			# LDAP
			Settings.upsert({ _id: "LDAP.Url" }, { $set: { type: "string", value: "", i18n_label: "LDAP_Url", group: "Accounts", where: [ 'server' ] } })
			Settings.upsert({ _id: "LDAP.Port" }, { $set: { type: "string", value: "", i18n_label: "LDAP_Port", group: "Accounts", where: [ 'server' ] } })
			Settings.upsert({ _id: "LDAP.DN" }, { $set: { type: "string_or_false", value: false, i18n_label: "LDAP_DN", group: "Accounts", where: [ 'client', 'server' ] } })

			# Registration
			Settings.upsert({ _id: "Accounts.RegistrationRequired" }, { $set: { type: "boolean", value: true, i18n_label: "Registration_required", group: "Accounts", where: [ 'server' ] } })
			Settings.upsert({ _id: "Accounts.EmailVerification" }, { $set: { type: "boolean", value: true, i18n_label: "Email_verification", group: "Accounts", where: [ 'server' ] } })

			# APIs
			Settings.upsert({ _id: "API.Analytics" }, { $set: { type: "string", value: "", i18n_label: "Analytics_ID", group: "API", where: [ 'client' ] } })
			Settings.upsert({ _id: "API.Piwik_URL" }, { $set: { type: "string", value: "", i18n_label: "Piwik_URL", group: "API", where: [ 'client' ] } })
			Settings.upsert({ _id: "API.Piwik_ID" }, { $set: { type: "string", value: "", i18n_label: "Piwik_ID", group: "API", where: [ 'client' ] } })

			# SMTP settings
			Settings.upsert { _id: "SMTP.Host" }, { $set: { type: "string", value: "", i18n_label: "SMTP_host", group: "SMTP", where: [ 'server' ] } }
			Settings.upsert { _id: "SMTP.Port" }, { $set: { type: "string", value: "", i18n_label: "SMTP_port", group: "SMTP", where: [ 'server' ] } }
			Settings.upsert { _id: "SMTP.Security" }, { $set: { type: "string", value: "", i18n_label: "SMTP_security", group: "SMTP", where: [ 'server' ] } }
			Settings.upsert { _id: "SMTP.Username" }, { $set: { type: "string", value: "", i18n_label: "SMTP_username", group: "SMTP", where: [ 'server' ] } }
			Settings.upsert { _id: "SMTP.Password" }, { $set: { type: "string", value: "", i18n_label: "SMTP_password", group: "SMTP", where: [ 'server' ] } }

			# Message editing
			Settings.upsert { _id: "Message.Edit" }, { $set: { type: "boolean", value: true, i18n_label: "Allow_message_editing", group: "Message", where: [ 'server' ] } }
			Settings.upsert { _id: "Message.Delete" }, { $set: { type: "boolean", value: true, i18n_label: "Allow_message_deleting", group: "Message", where: [ 'server' ] } }
			Settings.upsert { _id: "Message.ShowEditedStatus" }, { $set: { type: "boolean", value: true, i18n_label: "Show_edited_status", group: "Message", where: [ 'server' ] } }
			Settings.upsert { _id: "Message.ShowDeletedStatus" }, { $set: { type: "boolean", value: true, i18n_label: "Show_deleted_status", group: "Message", where: [ 'server' ] } }
			Settings.upsert { _id: "Message.KeepStatusHistory" }, { $set: { type: "boolean", value: true, i18n_label: "Keep_status_history", group: "Message", where: [ 'server' ] } }
			
			# Embedding
			Settings.upsert { _id: "Embed.Enable" }, { $set: { type: "boolean", value: true, i18n_label: "Enable_embedding", group: "Embed", where: [ 'server' ] } }


