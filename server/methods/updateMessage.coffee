Meteor.methods
	updateMessage: (message) ->
		if not Meteor.userId()
			throw new Meteor.Error('error-invalid-user', "Invalid user", { method: 'updateMessage' })

		originalMessage = RocketChat.models.Messages.findOneById message._id

		if not originalMessage?._id?
			return

		hasPermission = RocketChat.authz.hasPermission(Meteor.userId(), 'edit-message', message.rid)
		editAllowed = RocketChat.settings.get 'Message_AllowEditing'
		editOwn = originalMessage?.u?._id is Meteor.userId()

		me = RocketChat.models.Users.findOneById Meteor.userId()

		unless hasPermission or (editAllowed and editOwn)
			throw new Meteor.Error 'error-action-not-allowed', 'Message editing not allowed', { method: 'updateMessage', action: 'Message_editing' }

		blockEditInMinutes = RocketChat.settings.get 'Message_AllowEditing_BlockEditInMinutes'
		if blockEditInMinutes? and blockEditInMinutes isnt 0
			msgTs = moment(originalMessage.ts) if originalMessage.ts?
			currentTsDiff = moment().diff(msgTs, 'minutes') if msgTs?
			if currentTsDiff > blockEditInMinutes
				throw new Meteor.Error 'error-message-editing-blocked', 'Message editing is blocked', { method: 'updateMessage' }

		# If we keep history of edits, insert a new message to store history information
		if RocketChat.settings.get 'Message_KeepHistory'
			RocketChat.models.Messages.cloneAndSaveAsHistoryById originalMessage._id

		message.editedAt = new Date()
		message.editedBy =
			_id: Meteor.userId()
			username: me.username

		if urls = message.msg.match /([A-Za-z]{3,9}):\/\/([-;:&=\+\$,\w]+@{1})?([-A-Za-z0-9\.]+)+:?(\d+)?((\/[-\+=!:~%\/\.@\,\w]*)?\??([-\+=&!:;%@\/\.\,\w]+)?(?:#([^\s\)]+))?)?/g
			message.urls = urls.map (url) -> url: url

		message = RocketChat.callbacks.run 'beforeSaveMessage', message

		tempid = message._id
		delete message._id

		RocketChat.models.Messages.update
			_id: tempid
		,
			$set: message

		room = RocketChat.models.Rooms.findOneById message.rid

		Meteor.defer ->
			RocketChat.callbacks.run 'afterSaveMessage', RocketChat.models.Messages.findOneById(tempid), room
