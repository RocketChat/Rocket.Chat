Template.listChannelsFlex.helpers
	channel: ->
		return Template.instance().channelsList?.get()
	hasMore: ->
		return Template.instance().hasMore.get()
	tSearchChannels: ->
		return t('Search_Channels')
	sortSelected: (sort) ->
		return Template.instance().sort.get() is sort

Template.listChannelsFlex.events
	'click header': ->
		SideNav.closeFlex()

	'click .channel-link': ->
		SideNav.closeFlex()

	'click footer .create': ->
		if RocketChat.authz.hasAtLeastOnePermission( 'create-c')
			SideNav.setFlex "createChannelFlex"

	'mouseenter header': ->
		SideNav.overArrow()

	'mouseleave header': ->
		SideNav.leaveArrow()

	'scroll .content': _.throttle (e, t) ->
		if e.target.scrollTop >= e.target.scrollHeight - e.target.clientHeight
			t.limit.set(t.limit.get() + 50)
	, 200

	'keyup #channel-search': _.debounce (e, instance) ->
		instance.nameFilter.set($(e.currentTarget).val())
	, 300

	'change #sort': (e, instance) ->
		instance.sort.set($(e.currentTarget).val())

Template.listChannelsFlex.onCreated ->
	@channelsList = new ReactiveVar []
	@hasMore = new ReactiveVar true
	@limit = new ReactiveVar 50
	@nameFilter = new ReactiveVar ''
	@sort = new ReactiveVar 'msgs'

	@autorun =>
		Meteor.call 'channelsList', @nameFilter.get(), @limit.get(), @sort.get(), (err, result) =>
			if result
				@hasMore.set true
				@channelsList.set result.channels
				if result.channels.length < @limit.get()
					@hasMore.set false
