Template.directMessages.helpers
	isActive: ->
		return 'active' if ChatSubscription.findOne({ t: { $in: ['d']}, f: { $ne: true }, open: true, rid: Session.get('openedRoom') }, { fields: { _id: 1 } })?

	rooms: ->
		query = { t: { $in: ['d']}, f: { $ne: true }, open: true }

		if Meteor.user()?.settings?.preferences?.unreadRoomsMode
			query.alert =
				$ne: true

		return ChatSubscription.find query, { sort: 't': 1, 'name': 1 }

	canCreate: ->
		return RocketChat.authz.hasAtLeastOnePermission ['create-d']

Template.directMessages.events
	'click .add-room': (e, instance) ->
		if RocketChat.authz.hasAtLeastOnePermission('create-d')
			SideNav.setFlex "directMessagesFlex"
			SideNav.openFlex()
		else
			e.preventDefault()

	'click .more-direct-messages': ->
		SideNav.setFlex "listDirectMessagesFlex"
		SideNav.openFlex()
