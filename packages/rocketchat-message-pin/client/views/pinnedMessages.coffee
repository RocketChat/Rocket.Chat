Template.pinnedMessages.helpers
	hasMessages: ->
		return PinnedMessage.find({ rid: this.rid }, { sort: { ts: -1 } }).count() > 0

	messages: ->
		return PinnedMessage.find { rid: this.rid }, { sort: { ts: -1 } }

	notReadySubscription: ->
		return 'notready' unless Template.instance().subscriptionsReady()

Template.pinnedMessages.onCreated ->
	this.autorun =>
		this.subscribe 'pinnedMessages', Template.currentData().rid

Template.pinnedMessages.events
	'click .message-cog': (e) ->
		e.stopPropagation()
		e.preventDefault()
		message_id = $(e.currentTarget).closest('.message').attr('id')
		$('.message-dropdown:visible').hide()
		$(".pinned-messages-list \##{message_id} .message-dropdown").show()
