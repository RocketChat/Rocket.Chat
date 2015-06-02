Template.listChannelsFlex.helpers
	channel: ->
		return Template.instance().channelsList?.get()

Template.listChannelsFlex.onRendered ->
	instance = this
	instance.channelsList = new ReactiveVar []

	Meteor.call 'channelsList', (err, result) ->
		if result
			instance.channelsList.set result.channels

