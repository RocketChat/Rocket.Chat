Template.privateGroups.helpers
	tRoomMembers: ->
		return t('Members_placeholder')

	rooms: ->
		return ChatSubscription.find { t: { $in: ['p']}, f: { $ne: true } }, { sort: 't': 1, 'name': 1 }

Template.privateGroups.events
	'click .add-room': (e, instance) ->
		SideNav.setFlex "privateGroupsFlex"
		SideNav.openFlex()
		console.log Template.privateGroupsFlex.onCreated.instance
