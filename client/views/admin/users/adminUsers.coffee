Template.adminUsers.helpers
	isAdmin: ->
		return Meteor.user().admin is true
	isReady: ->
		return Template.instance().ready?.get()
	users: ->
		return Template.instance().users()
	flexOpened: ->
		return 'opened' if Session.equals('flexOpened', true)
	arrowPosition: ->
		return 'left' unless Session.equals('flexOpened', true)
	userData: ->
		return Meteor.users.findOne Session.get 'adminUsersSelected'
	userChannels: ->
		return ChatSubscription.find({ "u._id": Session.get 'adminUsersSelected' }, { fields: { rid: 1, name: 1, t: 1 }, sort: { t: 1, name: 1 } }).fetch()
	isLoading: ->
		return 'btn-loading' unless Template.instance().ready?.get()
	hasMore: ->
		return Template.instance().limit?.get() is Template.instance().users?().length
	phoneNumber: ->
		return '' unless @phoneNumber
		if @phoneNumber.length > 10
			return "(#{@phoneNumber.substr(0,2)}) #{@phoneNumber.substr(2,5)}-#{@phoneNumber.substr(7)}"
		else
			return "(#{@phoneNumber.substr(0,2)}) #{@phoneNumber.substr(2,4)}-#{@phoneNumber.substr(6)}"
	lastLogin: ->
		if @lastLogin
			return moment(@lastLogin).format('LLL')
	utcOffset: ->
		if @utcOffset?
			if @utcOffset > 0
				@utcOffset = "+#{@utcOffset}"

			return "UTC #{@utcOffset}"

Template.adminUsers.onCreated ->
	instance = @
	@limit = new ReactiveVar 50
	@filter = new ReactiveVar ''
	@ready = new ReactiveVar true

	@autorun ->
		filter = instance.filter.get()
		limit = instance.limit.get()
		subscription = instance.subscribe 'fullUsers', filter, limit
		instance.ready.set subscription.ready()

	@autorun ->
		if Session.get 'adminUsersSelected'
			channelSubscription = instance.subscribe 'userChannels', Session.get 'adminUsersSelected'

	@users = ->
		filter = _.trim instance.filter?.get()
		if filter
			filterReg = new RegExp filter, "i"
			query = { $or: [ { username: filterReg }, { name: filterReg }, { "emails.address": filterReg } ] }
		else
			query = {}
		
		return Meteor.users.find(query, { limit: instance.limit?.get(), sort: { username: 1, name: 1 } }).fetch()

Template.adminUsers.onRendered ->
	Tracker.afterFlush ->
		SideNav.setFlex "adminFlex"
		SideNav.openFlex()

Template.adminUsers.events
	'keydown #users-filter': (e) ->
		if e.which is 13
			e.stopPropagation()
			e.preventDefault()

	'keyup #users-filter': (e, t) ->
		e.stopPropagation()
		e.preventDefault()
		t.filter.set e.currentTarget.value

	'click .flex-tab .more': ->
		if (Session.get('flexOpened'))
			Session.set('flexOpened',false)
		else
			Session.set('flexOpened', true)

	'click .user-info': (e) ->
		e.preventDefault()
		Session.set 'adminUsersSelected', $(e.currentTarget).data('id')
		Session.set 'flexOpened', true

	'click .info-tabs a': (e) ->
		e.preventDefault()
		$('.info-tabs a').removeClass 'active'
		$(e.currentTarget).addClass 'active'

		$('.user-info-content').hide()
		$($(e.currentTarget).attr('href')).show()

	'click .load-more': (e, t) ->
		e.preventDefault()
		e.stopPropagation()
		t.limit.set t.limit.get() + 50
