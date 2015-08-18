Template.room.helpers
	messages: ->
		return ChatMessage.find { rid: this._id, t: { '$ne': 't' }  }, { sort: { ts: 1 } }

Template.room.events

	'keyup .input-message': (event) ->
		Template.instance().chatMessages.keyup(@_id, event, Template.instance())

	'keydown .input-message': (event) ->
		Template.instance().chatMessages.keydown(@_id, event, Template.instance())

Template.room.onCreated ->
	this.subscribe 'visitorRoom', visitorId.get()
	console.log 'visitor ->', visitorId.get()


Template.room.onRendered ->
	this.chatMessages = new ChatMessages
	this.chatMessages.init(this.firstNode)
