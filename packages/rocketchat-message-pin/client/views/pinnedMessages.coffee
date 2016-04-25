Template.pinnedMessages.helpers
	hasMessages: ->
		return PinnedMessage.find({ rid: @rid }, { sort: { ts: -1 } }).count() > 0

	messages: ->
		return PinnedMessage.find { rid: @rid }, { sort: { ts: -1 } }

	hasMore: ->
		return Template.instance().hasMore.get()

Template.pinnedMessages.onCreated ->
	@hasMore = new ReactiveVar true
	@limit = new ReactiveVar 50
	@autorun =>
		data = Template.currentData()
		@subscribe 'pinnedMessages', data.rid, @limit.get(), =>
			if PinnedMessage.find({ rid: data.rid }).count() < @limit.get()
				@hasMore.set false

Template.pinnedMessages.events
	'click .message-cog': (e, t) ->
		e.stopPropagation()
		e.preventDefault()
		message_id = $(e.currentTarget).closest('.message').attr('id')
		$('.message-dropdown:visible').hide()
		t.$("\##{message_id} .message-dropdown").remove()
		message = PinnedMessage.findOne message_id
		actions = RocketChat.MessageAction.getButtons message, 'pinned'
		el = Blaze.toHTMLWithData Template.messageDropdown, { actions: actions }
		t.$("\##{message_id} .message-cog-container").append el
		dropDown = t.$("\##{message_id} .message-dropdown")
		dropDown.show()

	'scroll .content': _.throttle (e, instance) ->
		if e.target.scrollTop >= e.target.scrollHeight - e.target.clientHeight && instance.hasMore.get()
			instance.limit.set(instance.limit.get() + 50)
	, 200
