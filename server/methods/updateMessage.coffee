Meteor.methods
	updateMessage: (message) ->
		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] updateMessage -> Invalid user")

		if not RocketChat.settings.get 'Message_AllowEditing'
			throw new Meteor.Error 'message-editing-not-allowed', "[methods] updateMessage -> Message editing not allowed"

		user = Meteor.users.findOne Meteor.userId()

		originalMessage = ChatMessage.findOne message._id

		unless user?.admin is true or originalMessage?.u?._id is Meteor.userId()
			throw new Meteor.Error 'not-authorized', '[methods] updateMessage -> Not authorized'

		console.log '[methods] updateMessage -> '.green, 'userId:', Meteor.userId(), 'arguments:', arguments

		# If we keep history of edits, insert a new message to store history information
		if RocketChat.settings.get 'Message_KeepHistory'
			originalMessage._hidden = true
			originalMessage.parent = originalMessage._id
			originalMessage.ets = new Date()
			delete originalMessage._id
			ChatMessage.insert originalMessage

		message.ets = new Date()

		if urls = message.msg.match /([A-Za-z]{3,9}):\/\/([-;:&=\+\$,\w]+@{1})?([-A-Za-z0-9\.]+)+:?(\d+)?((\/[-\+=!:~%\/\.@\,\w]+)?\??([-\+=&!:;%@\/\.\,\w]+)?#?([\w]+)?)?/g
			message.urls = urls

		message = RocketChat.callbacks.run 'beforeSaveMessage', message

		tempid = message._id
		delete message._id

		ChatMessage.update
			_id: tempid
			'u._id': Meteor.userId()
		,
			$set: message

		# Meteor.defer ->
		# 	RocketChat.callbacks.run 'afterSaveMessage', ChatMessage.findOne(message.id)
