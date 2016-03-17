Template.listPrivateGroupsFlex.helpers
	groups: ->
		return Template.instance().groups.get()
	hasMore: ->
		return Template.instance().hasMore.get()
	sortSelected: (sort) ->
		return Template.instance().sort.get() is sort
	hidden: ->
		return !!RocketChat.models.Subscriptions.findOne({ name: @name, open: false })

Template.listPrivateGroupsFlex.events
	'click header': ->
		SideNav.closeFlex()

	'click .channel-link': ->
		SideNav.closeFlex()

	'click footer .create': ->
		SideNav.setFlex "privateGroupsFlex"

	'mouseenter header': ->
		SideNav.overArrow()

	'mouseleave header': ->
		SideNav.leaveArrow()

	'scroll .content': _.throttle (e, t) ->
		if t.hasMore.get() and e.target.scrollTop >= e.target.scrollHeight - e.target.clientHeight
			t.limit.set(t.limit.get() + 50)
	, 200

	'keyup #channel-search': _.debounce (e, instance) ->
		instance.nameFilter.set($(e.currentTarget).val())
	, 300

	'change #sort': (e, instance) ->
		instance.sort.set($(e.currentTarget).val())

Template.listPrivateGroupsFlex.onCreated ->
	@groups = new ReactiveVar []
	@hasMore = new ReactiveVar true
	@limit = new ReactiveVar 50
	@nameFilter = new ReactiveVar ''
	@sort = new ReactiveVar 'name'

	@autorun =>
		@hasMore.set true
		options =  { fields: { name: 1 } }
		if _.isNumber @limit.get()
			options.limit = @limit.get()
		if _.trim(@sort.get())
			switch @sort.get()
				when 'name'
					options.sort = { name: 1 }
				when 'ls'
					options.sort = { ls: -1 }

		query = { t: { $in: ['p']}, f: { $ne: true }, archived: { $ne: true } }

		@groups.set RocketChat.models.Subscriptions.find({
			name: new RegExp s.trim(s.escapeRegExp(@nameFilter.get())), "i"
			t: 'p'
			archived: { $ne: true }
		}, options).fetch()
		if @groups.get().length < @limit.get()
			@hasMore.set false
