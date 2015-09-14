Template.room.helpers
	messages: ->
		return ChatMessage.find { rid: visitor.getRoom(), t: { '$ne': 't' }  }, { sort: { ts: 1 } }

Template.room.events
	'keyup .input-message': (event) ->
		Template.instance().chatMessages.keyup(visitor.getRoom(), event, Template.instance())

	'keydown .input-message': (event) ->
		Template.instance().chatMessages.keydown(visitor.getRoom(), event, Template.instance())

	'click .new-message': (e) ->
		Template.instance().atBottom = true
		Template.instance().find('.input-message').focus()

	'click .title': ->
		parentCall 'toggleWindow'

	'click .error': (e) ->
		$(e.currentTarget).removeClass('show')

Template.room.onCreated ->
	self = @
	self.autorun ->
		self.subscribe 'visitorRoom', visitor.getToken(), ->
			room = ChatRoom.findOne()
			if room?
				visitor.setRoom room._id
				RoomHistoryManager.getMoreIfIsEmpty room._id

	self.atBottom = true

Template.room.onRendered ->
	this.chatMessages = new ChatMessages
	this.chatMessages.init(this.firstNode)

Template.room.onRendered ->
	wrapper = this.find('.wrapper')
	newMessage = this.find(".new-message")

	template = this

	onscroll = _.throttle ->
		template.atBottom = wrapper.scrollTop >= wrapper.scrollHeight - wrapper.clientHeight
	, 200

	Meteor.setInterval ->
		if template.atBottom
			wrapper.scrollTop = wrapper.scrollHeight - wrapper.clientHeight
			newMessage.className = "new-message not"
	, 100

	wrapper.addEventListener 'touchstart', ->
		template.atBottom = false

	wrapper.addEventListener 'touchend', ->
		onscroll()
		# readMessage.enable()
		# readMessage.read()

	wrapper.addEventListener 'scroll', ->
		template.atBottom = false
		onscroll()

	wrapper.addEventListener 'mousewheel', ->
		template.atBottom = false
		onscroll()
		# readMessage.enable()
		# readMessage.read()

	wrapper.addEventListener 'wheel', ->
		template.atBottom = false
		onscroll()
		# readMessage.enable()
		# readMessage.read()

	# salva a data da renderização para exibir alertas de novas mensagens
	# $.data(this.firstNode, 'renderedAt', new Date)
