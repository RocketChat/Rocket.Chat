Meteor.startup ->
	Migrations.add
		version: 8
		up: ->
			console.log "Add default settings"
			
			# Accounts
			# LDAP
			Settings.upsert({ _id: "Accounts" }, { $set: { type: "group", i18nLabel: "Accounts" } })
			Settings.upsert({ _id: "LDAP.Url" }, { $set: { type: "variable", dataType: "string", value: "", i18nLabel: "LDAP_Url", group: "Accounts", where: [ "server" ] } })
			Settings.upsert({ _id: "LDAP.Port" }, { $set: { type: "variable", dataType: "string", value: "", i18nLabel: "LDAP_Port", group: "Accounts", where: [ "server" ] } })
			Settings.upsert({ _id: "LDAP.DN" }, { $set: { type: "variable", dataType: "string_or_false", value: false, i18nLabel: "LDAP_DN", group: "Accounts", where: [ "client", "server" ] } })

			# Registration
			Settings.upsert({ _id: "Accounts.RegistrationRequired" }, { $set: { type: "variable", dataType: "boolean", value: true, i18nLabel: "Registration_required", group: "Accounts", where: [ "server" ] } })
			Settings.upsert({ _id: "Accounts.EmailVerification" }, { $set: { type: "variable", dataType: "boolean", value: true, i18nLabel: "Email_verification", group: "Accounts", where: [ "server" ] } })

			# APIs
			Settings.upsert({ _id: "API" }, { $set: { type: "group", i18nLabel: "APIs" } })
			Settings.upsert({ _id: "API.Analytics" }, { $set: { type: "variable", dataType: "string", value: "", i18nLabel: "Analytics_ID", group: "API", where: [ "client" ] } })
			Settings.upsert({ _id: "API.Piwik_URL" }, { $set: { type: "variable", dataType: "string", value: "", i18nLabel: "Piwik_URL", group: "API", where: [ "client" ] } })
			Settings.upsert({ _id: "API.Piwik_ID" }, { $set: { type: "variable", dataType: "string", value: "", i18nLabel: "Piwik_ID", group: "API", where: [ "client" ] } })

			# SMTP settings
			Settings.upsert({ _id: "SMTP" }, { $set: { type: "group", i18nLabel: "SMTP" } })
			Settings.upsert { _id: "SMTP.Host" }, { $set: { type: "variable", dataType: "string", value: "", i18nLabel: "SMTP_host", group: "SMTP", where: [ "server" ] } }
			Settings.upsert { _id: "SMTP.Port" }, { $set: { type: "variable", dataType: "string", value: "", i18nLabel: "SMTP_port", group: "SMTP", where: [ "server" ] } }
			Settings.upsert { _id: "SMTP.Security" }, { $set: { type: "variable", dataType: "string", value: "", i18nLabel: "SMTP_security", group: "SMTP", where: [ "server" ] } }
			Settings.upsert { _id: "SMTP.Username" }, { $set: { type: "variable", dataType: "string", value: "", i18nLabel: "SMTP_username", group: "SMTP", where: [ "server" ] } }
			Settings.upsert { _id: "SMTP.Password" }, { $set: { type: "variable", dataType: "string", value: "", i18nLabel: "SMTP_password", group: "SMTP", where: [ "server" ] } }

			# Message editing
			Settings.upsert({ _id: "Message" }, { $set: { type: "group", i18nLabel: "Message" } })
			Settings.upsert { _id: "Message.Edit" }, { $set: { type: "variable", dataType: "boolean", value: true, i18nLabel: "Allow_message_editing", group: "Message", where: [ "server" ] } }
			Settings.upsert { _id: "Message.Delete" }, { $set: { type: "variable", dataType: "boolean", value: true, i18nLabel: "Allow_message_deleting", group: "Message", where: [ "server" ] } }
			Settings.upsert { _id: "Message.ShowEditedStatus" }, { $set: { type: "variable", dataType: "boolean", value: true, i18nLabel: "Show_edited_status", group: "Message", where: [ "server" ] } }
			Settings.upsert { _id: "Message.ShowDeletedStatus" }, { $set: { type: "variable", dataType: "boolean", value: true, i18nLabel: "Show_deleted_status", group: "Message", where: [ "server" ] } }
			Settings.upsert { _id: "Message.KeepStatusHistory" }, { $set: { type: "variable", dataType: "boolean", value: true, i18nLabel: "Keep_status_history", group: "Message", where: [ "server" ] } }
			
			# Embedding
			Settings.upsert({ _id: "Embed" }, { $set: { type: "group", i18nLabel: "Embed" } })
			Settings.upsert { _id: "Embed.Enable" }, { $set: { type: "variable", dataType: "boolean", value: true, i18nLabel: "Enable_embedding", group: "Embed", where: [ "server" ] } }


