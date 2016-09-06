Template.privateGroups.helpers
	isActive: ->
		return 'active' if ChatSubscription.findOne({ t: { $in: ['p']}, f: { $ne: true }, open: true, rid: Session.get('openedRoom') }, { fields: { _id: 1 } })?
		
	rooms: ->
		query = { t: { $in: ['p']}, f: { $ne: true }, open: true }

		if Meteor.user()?.settings?.preferences?.unreadRoomsMode
			query.alert =
				$ne: true

		return ChatSubscription.find query, { sort: 't': 1, 'name': 1 }

	total: ->
		return ChatSubscription.find({ t: { $in: ['p']}, f: { $ne: true } }).count()

	totalOpen: ->
		return ChatSubscription.find({ t: { $in: ['p']}, f: { $ne: true }, open: true }).count()
	
	canCreate: ->
		return RocketChat.authz.hasAtLeastOnePermission ['create-p']
		
Template.privateGroups.events
	'click .add-room': (e, instance) ->
		if RocketChat.authz.hasAtLeastOnePermission('create-p')
			SideNav.setFlex "privateGroupsFlex"
			SideNav.openFlex()
		else
			e.preventDefault()

	'click .more-groups': ->
		SideNav.setFlex "listPrivateGroupsFlex"
		SideNav.openFlex()
