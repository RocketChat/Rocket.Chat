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
	name: ->
		return if @name then @name else TAPi18next.t 'project:Unnamed'
	email: ->
		return @emails?[0]?.address
	flexOpened: ->
		return 'opened' if Session.equals('flexOpened', true)
	arrowPosition: ->
		return 'left' unless Session.equals('flexOpened', true)
	userData: ->
		return Meteor.users.findOne Session.get 'settingsUsersSelected'
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

	'click .deactivate': ->
		Meteor.call 'setUserActiveStatus', Session.get('settingsUsersSelected'), false, (error, result) ->
			if result
				toastr.success t('User_has_been_deactivated')
			if error
				toastr.error error.reason
	
	'click .activate': ->
		Meteor.call 'setUserActiveStatus', Session.get('settingsUsersSelected'), true, (error, result) ->
			if result
				toastr.success t('User_has_been_activated')
			if error
				toastr.error error.reason

	'click .delete': ->
		swal {
			title: t('Are_you_sure')
			text: t('Delete_User_Warning')
			type: 'warning'
			showCancelButton: true
			confirmButtonColor: '#DD6B55'
			confirmButtonText: t('Yes_delete_it')
			cancelButtonText: t('Cancel')
			closeOnConfirm: false
			html: false
		}, ->
			swal 
				title: t('Deleted')
				text: t('User_has_been_deleted')
				type: 'success'
				timer: 2000
				showConfirmButton: false 

			Meteor.call 'deleteUser', Session.get('settingsUsersSelected'), (error, result) ->
				if error
					toastr.error error.reason