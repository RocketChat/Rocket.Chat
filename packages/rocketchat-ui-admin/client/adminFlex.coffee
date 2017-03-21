Template.adminFlex.onCreated ->
	@settingsFilter = new ReactiveVar('')

	if not RocketChat.settings.cachedCollectionPrivate?
		RocketChat.settings.cachedCollectionPrivate = new RocketChat.CachedCollection({ name: 'private-settings', eventType: 'onLogged' })
		RocketChat.settings.collectionPrivate = RocketChat.settings.cachedCollectionPrivate.collection
		RocketChat.settings.cachedCollectionPrivate.init()

label = ->
	return TAPi18n.__(@i18nLabel or @_id)

Template.adminFlex.helpers
	groups: ->
		filter = Template.instance().settingsFilter.get()

		query =
			type: 'group'

		if filter
			filterRegex = new RegExp(_.escapeRegExp(filter), 'i')

			records = RocketChat.settings.collectionPrivate.find().fetch()
			groups = []
			records = records.forEach (record) ->
				if filterRegex.test(TAPi18n.__(record.i18nLabel or record._id))
					groups.push(record.group or record._id)

			groups = _.unique(groups)
			if groups.length > 0
				query._id =
					$in: groups
		RocketChat.settings.collectionPrivate.find(query).fetch()
		.map (el) =>
			el.label = label.apply(el)
			return el
		.sort (a, b) =>
			if a.label.toLowerCase() >= b.label.toLowerCase() then 1 else -1

	label: label

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

	'keyup [name=settings-search]': (e, t) ->
		t.settingsFilter.set(e.target.value)
