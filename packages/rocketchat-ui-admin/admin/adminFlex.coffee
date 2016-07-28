Template.adminFlex.onCreated ->
	if not RocketChat.settings.cachedCollectionPrivate?
		RocketChat.settings.cachedCollectionPrivate = new RocketChat.CachedCollection({ name: 'private-settings', eventType: 'onAll' })
		RocketChat.settings.collectionPrivate = RocketChat.settings.cachedCollectionPrivate.collection
		RocketChat.settings.cachedCollectionPrivate.init()


Template.adminFlex.helpers
	groups: ->
		return RocketChat.settings.collectionPrivate.find({type: 'group'}, { sort: { sort: 1, i18nLabel: 1 } }).fetch()
	label: ->
		return TAPi18n.__(@i18nLabel or @_id)
	adminBoxOptions: ->
		return RocketChat.AdminBox.getOptions()


Template.adminFlex.events
	'mouseenter header': ->
		SideNav.overArrow()

	'mouseleave header': ->
		SideNav.leaveArrow()

	'click header': ->
		SideNav.closeFlex()

	'click .cancel-settings': ->
		SideNav.closeFlex()

	'click .admin-link': ->
		menu.close()
