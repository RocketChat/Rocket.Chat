Template.listChannelsFlex.helpers
	channel: ->
		return Template.instance().channelsList?.get()
	hasMore: ->
		return Template.instance().hasMore.get()
	sortChannelsSelected: (sort) ->
		return Template.instance().sortChannels.get() is sort
	sortSubscriptionsSelected: (sort) ->
		return Template.instance().sortSubscriptions.get() is sort
	showSelected: (show) ->
		return Template.instance().show.get() is show
	member: ->
		return !!RocketChat.models.Subscriptions.findOne({ name: @name, open: true })
	hidden: ->
		return !!RocketChat.models.Subscriptions.findOne({ name: @name, open: false })

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
		if t.hasMore.get() and e.target.scrollTop >= e.target.scrollHeight - e.target.clientHeight
			t.limit.set(t.limit.get() + 50)
	, 200

	'keyup #channel-search': _.debounce (e, instance) ->
		instance.nameFilter.set($(e.currentTarget).val())
	, 300

	'change #sort-channels': (e, instance) ->
		instance.sortChannels.set($(e.currentTarget).val())

	'change #sort-subscriptions': (e, instance) ->
		instance.sortSubscriptions.set($(e.currentTarget).val())

	'change #show': (e, instance) ->
		show = $(e.currentTarget).val()
		if show is 'joined'
			instance.$('#sort-channels').hide();
			instance.$('#sort-subscriptions').show();
		else
			instance.$('#sort-channels').show();
			instance.$('#sort-subscriptions').hide();
		instance.show.set(show)

Template.listChannelsFlex.onCreated ->
	@channelsList = new ReactiveVar []
	@hasMore = new ReactiveVar true
	@limit = new ReactiveVar 50
	@nameFilter = new ReactiveVar ''
	@sortChannels = new ReactiveVar 'msgs'
	@sortSubscriptions = new ReactiveVar 'name'
	@show = new ReactiveVar 'all'

	@autorun =>
		if @show.get() is 'joined'
			@hasMore.set true
			options =  { fields: { name: 1 } }
			if _.isNumber @limit.get()
				options.limit = @limit.get()
			if _.trim(@sortSubscriptions.get())
				switch @sortSubscriptions.get()
					when 'name'
						options.sort = { name: 1 }
					when 'ls'
						options.sort = { ls: -1 }
			@channelsList.set RocketChat.models.Subscriptions.find({
				name: new RegExp s.trim(s.escapeRegExp(@nameFilter.get())), "i"
				t: 'c'
			}, options).fetch()
			if @channelsList.get().length < @limit.get()
				@hasMore.set false
		else
			Meteor.call 'channelsList', @nameFilter.get(), @limit.get(), @sortChannels.get(), (err, result) =>
				if result
					@hasMore.set true
					@channelsList.set result.channels
					if result.channels.length < @limit.get()
						@hasMore.set false
