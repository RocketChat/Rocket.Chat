Template.channels.helpers
	tRoomMembers: ->
		return t('chatRooms.Members_placeholder')

	rooms: ->
		return ChatSubscription.find { uid: Meteor.userId(), t: { $in: ['c']}, f: { $ne: true } }, { sort: 't': 1, 'rn': 1 }
	total: ->
		return ChatSubscription.find({ uid: Meteor.userId(), t: { $in: ['c']}, f: { $ne: true } }, { sort: 't': 1, 'rn': 1 }).fetch().length

Template.channels.events
	'click .add-room': (e, instance) ->
		SideNav.setFlex "createChannelFlex"
		SideNav.openFlex()

	'click .more-channels': ->
		SideNav.setFlex "listChannelsFlex"
		SideNav.openFlex()
