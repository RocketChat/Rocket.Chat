Template.adminRooms.helpers
	isReady: ->
		return Template.instance().ready?.get()
	rooms: ->
		return Template.instance().rooms()
	flexOpened: ->
		return 'opened' if RocketChat.TabBar.isFlexOpen()
	arrowPosition: ->
		return 'left' unless RocketChat.TabBar.isFlexOpen()
	isLoading: ->
		return 'btn-loading' unless Template.instance().ready?.get()
	hasMore: ->
		return Template.instance().limit?.get() is Template.instance().rooms?().count()
	roomCount: ->
		return Template.instance().rooms?().count()
	name: ->
		if @t is 'c' or @t is 'p'
			return @name
		else if @t is 'd'
			return @usernames.join ' x '
	type: ->
		if @t is 'c'
			return TAPi18n.__ 'Channel'
		else if @t is 'd'
			return TAPi18n.__ 'Direct Message'
		if @t is 'p'
			return TAPi18n.__ 'Private Group'
	roomData: ->
		return ChatRoom.findOne Session.get 'adminRoomsSelected'

Template.adminRooms.onCreated ->
	instance = @
	@limit = new ReactiveVar 50
	@filter = new ReactiveVar ''
	@types = new ReactiveVar []
	@ready = new ReactiveVar true

	@autorun ->
		filter = instance.filter.get()
		types = instance.types.get()
		limit = instance.limit.get()
		subscription = instance.subscribe 'adminRooms', filter, types, limit
		instance.ready.set subscription.ready()

	@rooms = ->
		filter = _.trim instance.filter?.get()
		types = instance.types?.get()
		
		unless _.isArray types
			types = []

		query = {}
	
		filter = _.trim filter
		if filter
			filterReg = new RegExp filter, "i"
			query = { $or: [ { name: filterReg }, { t: 'd', usernames: filterReg } ] }
		
		if types.length
			query['t'] = { $in: types }
		
		return ChatRoom.find(query, { limit: instance.limit?.get(), sort: { name: 1 } })

	@getSearchTypes = ->
		return _.map $('[name=room-type]:checked'), (input) -> return $(input).val()

Template.adminRooms.onRendered ->
	Tracker.afterFlush ->
		SideNav.setFlex "adminFlex"
		SideNav.openFlex()

Template.adminRooms.events
	'keydown #rooms-filter': (e) ->
		if e.which is 13
			e.stopPropagation()
			e.preventDefault()

	'keyup #rooms-filter': (e, t) ->
		e.stopPropagation()
		e.preventDefault()
		t.filter.set e.currentTarget.value

	'click .flex-tab .more': ->
		if RocketChat.TabBar.isFlexOpen()
			RocketChat.TabBar.closeFlex()
		else
			RocketChat.TabBar.openFlex()

	'click .room-info': (e) ->
		e.preventDefault()
		Session.set 'adminRoomsSelected', $(e.currentTarget).data('id')
		RocketChat.TabBar.openFlex()

	'click .room-info-tabs a': (e) ->
		e.preventDefault()
		$('.room-info-tabs a').removeClass 'active'
		$(e.currentTarget).addClass 'active'

	'click .load-more': (e, t) ->
		e.preventDefault()
		e.stopPropagation()
		t.limit.set t.limit.get() + 50

	'change [name=room-type]': (e, t) ->
		t.types.set t.getSearchTypes()
