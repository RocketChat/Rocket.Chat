Template.combined.helpers
	isActive: ->
		return 'active' if ChatSubscription.findOne({ t: { $in: ['c', 'p']}, f: { $ne: true }, open: true, rid: Session.get('openedRoom') }, { fields: { _id: 1 } })?

	rooms: ->
		query =
			t: { $in: ['c', 'p']},
			open: true

		if RocketChat.settings.get 'Favorite_Rooms'
			query.f = { $ne: true }

		if Meteor.user()?.settings?.preferences?.unreadRoomsMode
			query.alert =
				$ne: true

		return ChatSubscription.find query, { sort: 'name': 1 }

Template.combined.events
	'click .more-channels': ->
		SideNav.setFlex "listCombinedFlex"
		SideNav.openFlex()
