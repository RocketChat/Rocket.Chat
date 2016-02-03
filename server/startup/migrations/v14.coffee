RocketChat.Migrations.add
	version: 14
	up: ->
		# Remove unused settings
		RocketChat.models.Settings.remove { _id: "API_Piwik_URL" }
		RocketChat.models.Settings.remove { _id: "API_Piwik_ID" }

		RocketChat.models.Settings.remove { _id: "Message_Edit" }
		RocketChat.models.Settings.remove { _id: "Message_Delete" }
		RocketChat.models.Settings.remove { _id: "Message_KeepStatusHistory" }

		RocketChat.models.Settings.update { _id: "Message_ShowEditedStatus" }, { $set: { type: "boolean", value: true } }
		RocketChat.models.Settings.update { _id: "Message_ShowDeletedStatus" }, { $set: { type: "boolean", value: false } }

		metaKeys = [
			'old': 'Meta:language'
			'new': 'Meta_language'
		,
			'old': 'Meta:fb:app_id'
			'new': 'Meta_fb_app_id'
		,
			'old': 'Meta:robots'
			'new': 'Meta_robots'
		,
			'old': 'Meta:google-site-verification'
			'new': 'Meta_google-site-verification'
		,
			'old': 'Meta:msvalidate.01'
			'new': 'Meta_msvalidate01'
		]

		for oldAndNew in metaKeys
			oldValue = RocketChat.models.Settings.findOne({_id: oldAndNew.old})?.value
			newValue = RocketChat.models.Settings.findOne({_id: oldAndNew.new})?.value
			if oldValue? and not newValue?
				RocketChat.models.Settings.update { _id: oldAndNew.new }, { $set: { value: newValue } }

			RocketChat.models.Settings.remove { _id: oldAndNew.old }


		RocketChat.models.Settings.remove { _id: "SMTP_Security" }
