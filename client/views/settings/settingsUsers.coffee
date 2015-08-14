Template.settingsUsers.helpers
	isAdmin: ->
		return Meteor.user().admin is true
	isReady: ->
		return Template.instance().ready?.get()
	users: ->
		filter = _.trim Template.instance().filter?.get()
		if filter
			filterReg = new RegExp filter, "i"
			query = { $or: [ { username: filterReg }, { name: filterReg }, { "emails.address": filterReg } ] }
		else
			query = {}
		return Meteor.users.find(query, { limit: Template.instance().limit?.get(), sort: { username: 1 } }).fetch()
	flexOpened: ->
		return 'opened' if Session.equals('flexOpened', true)
	arrowPosition: ->
		return 'left' unless Session.equals('flexOpened', true)
	userData: ->
		return Meteor.users.findOne Session.get 'settingsUsersSelected'
	userChannels: ->
		return ChatSubscription.find({ "u._id": Session.get 'settingsUsersSelected' }, { fields: { rid: 1, name: 1, t: 1 }, sort: { t: 1, name: 1 } }).fetch()

Template.settingsUsers.onCreated ->
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
		if Session.get 'settingsUsersSelected'
			channelSubscription = instance.subscribe 'userChannels', Session.get 'settingsUsersSelected'

Template.settingsUsers.onRendered ->
	Tracker.afterFlush ->
		SideNav.setFlex "settingsFlex"
		SideNav.openFlex()

Template.settingsUsers.events
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
		Session.set 'settingsUsersSelected', $(e.currentTarget).data('id')
		Session.set 'flexOpened', true

	'click .user-info-tabs a': (e) ->
		e.preventDefault()
		$('.user-info-tabs a').removeClass 'active'
		$(e.currentTarget).addClass 'active'

		$('.user-info-content').hide()
		$($(e.currentTarget).attr('href')).show()