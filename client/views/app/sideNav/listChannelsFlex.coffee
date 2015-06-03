Template.listChannelsFlex.helpers
	channel: ->
		return Template.instance().channelsList?.get()

Template.listChannelsFlex.events
	'click .channel-link': ->
		SideNav.closeFlex()

Template.listChannelsFlex.onCreated ->
	instance = this
	instance.channelsList = new ReactiveVar []

	Meteor.call 'channelsList', (err, result) ->
		if result
			instance.channelsList.set result.channels

