Meteor.methods
	updateMessage: (message) ->
		if not Meteor.userId()
			return false

		originalMessage = ChatMessage.findOne message._id

		hasPermission = RocketChat.authz.hasAtLeastOnePermission('edit-message', message.rid)
		editAllowed = RocketChat.settings.get 'Message_AllowEditing'
		editOwn = originalMessage?.u?._id is Meteor.userId()

		me = Meteor.users.findOne Meteor.userId()

		unless hasPermission or (editAllowed and editOwn)
			toastr.error t('error-action-not-allowed', { action: t('Message_editing') })
			return false

		blockEditInMinutes = RocketChat.settings.get 'Message_AllowEditing_BlockEditInMinutes'
		if blockEditInMinutes? and blockEditInMinutes isnt 0
			msgTs = moment(originalMessage.ts) if originalMessage.ts?
			currentTsDiff = moment().diff(msgTs, 'minutes') if msgTs?
			if currentTsDiff > blockEditInMinutes
				toastr.error t('error-message-editing-blocked')
				return false

		Tracker.nonreactive ->

			message.editedAt = new Date(Date.now() + TimeSync.serverOffset())
			message.editedBy =
				_id: Meteor.userId()
				username: me.username

			message = RocketChat.callbacks.run 'beforeSaveMessage', message

			ChatMessage.update
				_id: message._id
				'u._id': Meteor.userId()
			,
				$set:
					"editedAt": message.editedAt
					"editedBy": message.editedBy
					msg: message.msg
