Template.channels.helpers
	isActive: ->
		return 'active' if ChatSubscription.findOne({ t: { $in: ['c']}, f: { $ne: true }, open: true, rid: Session.get('openedRoom') }, { fields: { _id: 1 } })?

	rooms: ->
		query =
			t: { $in: ['c']},
			open: true

		if RocketChat.settings.get 'Favorite_Rooms'
			query.f = { $ne: true }

		if Meteor.user()?.settings?.preferences?.unreadRoomsMode
			query.alert =
				$ne: true

		if Session.equals('RoomSortType', 'name')
			sort = {sort: 't': 1, 'name': 1 }
		else
			sort = {sort: 'la': -1 }

		return ChatSubscription.find query, sort

Template.channels.events
	'click .more-channels': ->
		SideNav.setFlex "listChannelsFlex"
		SideNav.openFlex()
