Template.starredMessages.helpers
	hasMessages: ->
		return StarredMessage.find({ rid: @rid }, { sort: { ts: -1 } }).count() > 0

	messages: ->
		return StarredMessage.find { rid: @rid }, { sort: { ts: -1 } }

	message: ->
		return _.extend(this, { customClass: 'starred' })

	hasMore: ->
		return Template.instance().hasMore.get()

Template.starredMessages.onCreated ->
	@hasMore = new ReactiveVar true
	@limit = new ReactiveVar 50
	@autorun =>
		sub = @subscribe 'starredMessages', @data.rid, @limit.get()
		if sub.ready()
			if StarredMessage.find({ rid: @data.rid }).count() < @limit.get()
				@hasMore.set false

Template.starredMessages.events
	'click .message-cog': (e, t) ->
		e.stopPropagation()
		e.preventDefault()
		message_id = $(e.currentTarget).closest('.message').attr('id')
		RocketChat.MessageAction.hideDropDown()
		t.$("\##{message_id} .message-dropdown").remove()
		message = StarredMessage.findOne message_id
		actions = RocketChat.MessageAction.getButtons message, 'starred'
		el = Blaze.toHTMLWithData Template.messageDropdown, { actions: actions }
		t.$("\##{message_id} .message-cog-container").append el
		dropDown = t.$("\##{message_id} .message-dropdown")
		dropDown.show()

	'scroll .content': _.throttle (e, instance) ->
		if e.target.scrollTop >= e.target.scrollHeight - e.target.clientHeight
			instance.limit.set(instance.limit.get() + 50)
	, 200
