Template.directMessagesFlex.helpers
	error: ->
		return Template.instance().error.get()

	autocompleteSettings: ->
		return {
			limit: 10
			# inputDelay: 300
			rules: [
				{
					# @TODO maybe change this 'collection' and/or template
					collection: 'UserAndRoom'
					subscription: 'roomSearch'
					field: 'username'
					template: Template.userSearch
					noMatchTemplate: Template.userSearchEmpty
					matchAll: true
					filter:
						type: 'u'
						_id: { $ne: Meteor.userId() }
					sort: 'username'
				}
			]
		}
	securityLabelsContext: ->
		return {
		onSelectionChanged: Template.instance().onSelectionChanged
		isOptionSelected: Template.instance().isOptionSelected
		isOptionDisabled: Template.instance().isOptionDisabled
		securityLabels: Template.instance().allowedLabels
		}
	securityLabelsInitialized: ->
		return Template.instance().securityLabelsInitialized.get()
	relabelRoom: ->
		return Template.instance().data.relabelRoom?
	#nameReadonly: ->
	#	if Template.instance().data.relabelRoom then 'readonly' else ''
	selectedUser: ->
		return Template.instance().selectedUser.get()

Template.directMessagesFlex.onRendered ->
	instance = this;
	# fill input field with pre-selected user
	if instance.selectedUser.get()
		field = instance.find('#who')
		field.value = instance.selectedUser.get()

Template.directMessagesFlex.events
	'autocompleteselect #who': (event, instance, doc) ->
		instance.selectedUser.set doc.username
		event.currentTarget.focus()
		###
		parameters = {}
		parameters.usernames = [doc.username]
		Meteor.call 'getAllowedConversationPermissions', parameters, (err, result) ->
			if err
				return toastr.error err.reason
			console.log JSON.stringify result
			instance.accessOptions.set result
		###

	'click .cancel-direct-message': (e, instance) ->
		SideNav.closeFlex()
		instance.clearForm()

	'click header': (e, instance) ->
		SideNav.closeFlex()
		instance.clearForm()

	'mouseenter header': ->
		SideNav.overArrow()

	'mouseleave header': ->
		SideNav.leaveArrow()

	'keydown input[type="text"]': (e, instance) ->
		Template.instance().error.set([])

	'click .save-direct-message': (e, instance) ->
		err = SideNav.validate()
		if not err
			accessPermissions = instance.selectedLabelIds
			rid = instance.data.relabelRoom
			if rid
				Meteor.call 'updateRoom', rid, instance.selectedUser.get(), null, accessPermissions, (err, result) ->
					if err
						return toastr.error err.reason
					SideNav.closeFlex()
					instance.clearForm()
					Router.go 'room', { _id: result.rid }
			else
				Meteor.call 'createDirectMessage', instance.selectedUser.get(), accessPermissions, (err, result) ->
					if err
						return toastr.error err.reason
					SideNav.closeFlex()
					instance.clearForm()
					Router.go 'room', { _id: result.rid }
		else
			Template.instance().error.set(err)



Template.directMessagesFlex.onCreated ->
	instance = this
	instance.selectedUser = new ReactiveVar
	instance.error = new ReactiveVar []
	#instance.accessOptions = new ReactiveVar

	instance.clearForm = ->
		instance.error.set([])
		instance.selectedUser.set null
		instance.find('#who').value = ''
		instance.roomData = undefined

	# labels that all members have in common
	instance.allowedLabels = []
	# reactive trigger set to true when labels returned asynchronously from server
	instance.securityLabelsInitialized = new ReactiveVar(false)
	# selected security label access permission ids
	instance.selectedLabelIds = []
	instance.disabledLabelIds = []

	# labels assignable by the current user
	userPerms = AccessPermissions.find({_id:{$in: Meteor.user().profile.access}}).fetch()
	reltoPerms = AccessPermissions.find({type:'Release Caveat'}).fetch()
	instance.allowedLabels = _.chain(userPerms).push(reltoPerms).flatten().uniq(false, (item)->return item._id).value()


	# adds/remove access permission ids from list of selected labels
	instance.onSelectionChanged = (params) ->
		if params.selected
			instance.selectedLabelIds.push params.selected
		else if params.deselected
			# remove deselected if it exist
			instance.selectedLabelIds = _.without(instance.selectedLabelIds, params.deselected)
	instance.isOptionSelected = (id) ->
		_.contains instance.selectedLabelIds, id

	# determine if label is disabled
	instance.isOptionDisabled = (id) ->
		_.contains instance.disabledLabelIds, id



	# Tracker.autorun function that gets executed on template creation, and then re-executed
	# on changes to the reactive inputs (in this case, Session data and subscription to the
	# 'room' publication). If the 'relabelRoom' variable is set in the data context (meaning
	# we are relabeling rather than creating a room), get a subscription and then "wait" for
	# the room data to be populated in Session variable (see roomObserve.coffee). Once that
	# data is set, stop further execution of this function and then populate the label info
	# input fields for the room.
	#
	# Since function is tied to Template instance, will automatically stop if template on
	# destroy (http://docs.meteor.com/#/full/template_autorun).
	instance.autorun (c) ->
		# check if we are relabeling the room
		if instance.data.relabelRoom?
			# get a subscription to the room (in case we don't have one already)
			Meteor.subscribe('room', instance.data.relabelRoom)
			# function will automatically re-run on changes to this session variable, thus
			# it will essentially "wait" for the data to get set
			if Session.get('roomData' + instance.data.relabelRoom)
				# once we have the data, no need to keep re-running
				c.stop()
				# get room data
				instance.room = Session.get('roomData' + instance.data.relabelRoom)
				# select existing permissions and disallow removing them
				instance.selectedLabelIds = instance.room.accessPermissions
				instance.disabledLabelIds = instance.room.accessPermissions
				username = _.without(instance.room.usernames, Meteor.user().username)[0]
				instance.selectedUser.set username
				instance.securityLabelsInitialized.set true

		# if creating a new room (rather than relabel), populate default values (UNCLASS//RELTO USA)
		else
			# no need to keep running this autorun function, since nothing to wait for
			c.stop()
			userCountryCode = _.find(userPerms, (perm) -> return perm.type is 'Release Caveat' )
			# TODO update to get default classification setting and system country code
			instance.selectedLabelIds = _.uniq(['U', '300', userCountryCode?._id])
			instance.disabledLabelIds = _.uniq(['300', userCountryCode?._id])
			if instance.data.user
				instance.selectedUser.set instance.data.user 
			instance.securityLabelsInitialized.set true

