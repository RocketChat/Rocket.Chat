Template.starredMessages.helpers
	hasMessages: ->
		return StarredMessage.find({ rid: this.rid }, { sort: { ts: -1 } }).count() > 0

	messages: ->
		return StarredMessage.find { rid: this.rid }, { sort: { ts: -1 } }

	notReadySubscription: ->
		return 'notready' unless Template.instance().subscriptionsReady()

Template.starredMessages.onCreated ->
	this.autorun =>
		this.subscribe 'starredMessages', Template.currentData().rid

Template.starredMessages.events
	'click .message-cog': (e) ->
		e.stopPropagation()
		e.preventDefault()
		message_id = $(e.currentTarget).closest('.message').attr('id')
		$('.message-dropdown:visible').hide()
		$(".starred-messages-list \##{message_id} .message-dropdown").show()
