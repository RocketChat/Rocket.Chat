Template.privateGroups.helpers
	tRoomMembers: ->
		return t('chatRooms.Members_placeholder')
	rooms: ->
		return ChatSubscription.find { uid: Meteor.userId(), t: { $in: ['p']}, f: { $ne: true } }, { sort: 't': 1, 'rn': 1 }
	total: ->
		return ChatSubscription.find({ uid: Meteor.userId(), t: { $in: ['p']}, f: { $ne: true } }, { sort: 't': 1, 'rn': 1 }).fetch().length

Template.privateGroups.events
	'click .add-room': (e, instance) ->
		SideNav.setFlex "privateGroupsFlex"
		SideNav.openFlex()
		#instance.clearForm()
		#$('#pvt-group-name').focus()
