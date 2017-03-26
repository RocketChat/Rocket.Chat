Template.unreadRooms.helpers
	hasUnread: ->
		return 'has-unread' if Meteor.user()?.settings?.preferences?.unreadRoomsMode and Template.instance().unreadRooms.count() > 0

	rooms: ->
		return Template.instance().unreadRooms

Template.unreadRooms.onCreated ->
	@autorun =>
		query =
			alert: true
			open: true

		if Session.equals('RoomSortType', 'name')
			sort = {sort: 't': 1, 'name': 1 }
		else
			sort = {sort: 'la': -1 }

		@unreadRooms = ChatSubscription.find query, sort
