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

		@unreadRooms = ChatSubscription.find query, { sort: 't': 1, 'name': 1 }
