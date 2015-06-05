Template.privateGroups.helpers
	tRoomMembers: ->
		return t('chatRooms.Members_placeholder')
	rooms: ->
		return ChatSubscription.find { t: { $in: ['p']}, f: { $ne: true } }, { sort: 't': 1, 'name': 1 }
	total: ->
		return ChatSubscription.find({ t: { $in: ['p']}, f: { $ne: true } }).count()

Template.privateGroups.events
	'click .add-room': (e, instance) ->
		SideNav.setFlex "privateGroupsFlex"
		SideNav.openFlex()
		console.log Template.privateGroupsFlex.onCreated.instance
