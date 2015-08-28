Meteor.methods
	updateMessage: (message) ->
		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] updateMessage -> Invalid user")

		if not RocketChat.settings.get 'Message_AllowEditing'
			throw new Meteor.Error 'message-editing-not-allowed', "[methods] updateMessage -> Message editing not allowed"

		console.log '[methods] updateMessage -> '.green, 'userId:', Meteor.userId(), 'arguments:', arguments

		# If we keep history of edits, insert a new message to store history information
		if RocketChat.settings.get 'Message_KeepHistory'
			history = ChatMessage.findOne message._id
			history._hidden = true
			history.parent = history._id
			history.ets = new Date()
			delete history._id
			ChatMessage.insert history

		message.ets = new Date()

		if urls = message.msg.match /([A-Za-z]{3,9}):\/\/([-;:&=\+\$,\w]+@{1})?([-A-Za-z0-9\.]+)+:?(\d+)?((\/[-\+=!:~%\/\.@\,\w]+)?\??([-\+=&!:;%@\/\.\,\w]+)?#?([\w]+)?)?/g
			message.urls = urls

		message = RocketChat.callbacks.run 'beforeSaveMessage', message

		ChatMessage.update
			_id: message._id
			'u._id': Meteor.userId()
		,
			$set: message

		# Meteor.defer ->
		# 	RocketChat.callbacks.run 'afterSaveMessage', ChatMessage.findOne(message.id)