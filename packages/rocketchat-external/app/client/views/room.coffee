Template.room.helpers
	messages: ->
		return ChatMessage.find { rid: visitor.getRoom(), t: { '$ne': 't' }  }, { sort: { ts: 1 } }

Template.room.events

	'keyup .input-message': (event) ->
		Template.instance().chatMessages.keyup(visitor.getRoom(), event, Template.instance())

	'keydown .input-message': (event) ->
		Template.instance().chatMessages.keydown(visitor.getRoom(), event, Template.instance())

Template.room.onCreated ->
	self = @
	self.autorun ->
		console.log 'visitor ->',visitor.getToken()
		self.subscribe 'visitorRoom', visitor.getToken(), ->
			console.log 'visitorRoom.ready()'
			room = ChatRoom.findOne()
			if room?
				visitor.setRoom room._id

Template.room.onRendered ->
	this.chatMessages = new ChatMessages
	this.chatMessages.init(this.firstNode)
