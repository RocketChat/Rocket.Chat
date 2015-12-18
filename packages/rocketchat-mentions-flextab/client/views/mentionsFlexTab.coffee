Template.mentionsFlexTab.helpers
	hasMessages: ->
		return MentionedMessage.find({ rid: @rid }, { sort: { ts: -1 } }).count() > 0

	messages: ->
		return MentionedMessage.find { rid: @rid }, { sort: { ts: -1 } }

	notReadySubscription: ->
		return 'notready' unless Template.instance().subscriptionsReady()

Template.mentionsFlexTab.onCreated ->
	@autorun =>
		@subscribe 'mentionedMessages', @data.rid

Template.mentionsFlexTab.events
	'click .message-cog': (e) ->
		e.stopPropagation()
		e.preventDefault()
		message_id = $(e.currentTarget).closest('.message').attr('id')
		$('.message-dropdown:visible').hide()
		$(".mentioned-messages-list \##{message_id} .message-dropdown").remove()
		message = MentionedMessage.findOne message_id
		actions = RocketChat.MessageAction.getButtons message
		el = Blaze.toHTMLWithData Template.messageDropdown, { actions: actions }
		$(".mentioned-messages-list \##{message_id} .message-cog-container").append el
		dropDown = $(".mentioned-messages-list \##{message_id} .message-dropdown")
		dropDown.show()
