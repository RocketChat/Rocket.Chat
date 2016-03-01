Template.listChannelsFlex.helpers
	channel: ->
		return Template.instance().channelsList?.get()
	tSearchChannels: ->
		return t('Search_Channels')

Template.listChannelsFlex.events
	'click header': ->
		SideNav.closeFlex()

	'click .channel-link': ->
		SideNav.closeFlex()

	'click footer .create': ->
		if RocketChat.authz.hasAtLeastOnePermission( 'create-c')
			SideNav.setFlex "createChannelFlex"

	'mouseenter header': ->
		SideNav.overArrow()

	'mouseleave header': ->
		SideNav.leaveArrow()

	'keyup #channel-search': _.debounce (e, instance) ->
		instance.nameFilter.set($(e.currentTarget).val())
	, 300


Template.listChannelsFlex.onCreated ->
	instance = this
	instance.nameFilter = new ReactiveVar ''
	instance.channelsList = new ReactiveVar []

	instance.autorun ->
		Meteor.call 'channelsList', instance.nameFilter.get(), (err, result) ->
			if result
				instance.channelsList.set result.channels

