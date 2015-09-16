Template.channels.helpers
	tRoomMembers: ->
		return t('Members_placeholder')

	isActive: ->
		return 'active' if ChatSubscription.findOne({ t: { $in: ['c']}, f: { $ne: true }, open: true, rid: Session.get('openedRoom') }, { fields: { _id: 1 } })?

	rooms: ->
		return ChatSubscription.find { t: { $in: ['c']}, f: { $ne: true }, open: true }, { sort: 't': 1, 'name': 1 }

Template.channels.events
	'click .add-room': (e, instance) ->
		if RocketChat.authz.hasAtLeastOnePermission('create-c')
			SideNav.setFlex "createChannelFlex"
			SideNav.openFlex()
		else 
			e.preventDefault()	

	'click .more-channels': ->
		SideNav.setFlex "listChannelsFlex"
		SideNav.openFlex()
