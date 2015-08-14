Template.privateGroupsFlex.helpers
	selectedUsers: ->
		return Template.instance().selectedUsers.get()

	name: ->
		return Template.instance().selectedUserNames[this.valueOf()]

	groupName: ->
		return Template.instance().groupName.get()

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
						$and: [
							{ _id: { $ne: Meteor.userId() } }
							{ username: { $nin: Template.instance().selectedUsers.get() } }
						]
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
	nameReadonly: ->
		if Template.instance().data.relabelRoom then 'readonly' else ''


Template.privateGroupsFlex.events
	'autocompleteselect #pvt-group-members': (event, instance, doc) ->
		instance.selectedUsers.set instance.selectedUsers.get().concat doc.username
		# TODO display full name.  Originally this displayed full name, but we changed this 
		# when we reused this template to edit a room.  The room only has usernames, not the 
		# full name and we have to add a Method call to retrieve the full name from a username
		instance.selectedUserNames[doc.username] = doc.username
		event.currentTarget.value = ''
		event.currentTarget.focus()

	'click .remove-room-member': (e, instance) ->
		self = @
		users = Template.instance().selectedUsers.get()
		users = _.reject Template.instance().selectedUsers.get(), (_id) ->
			return _id is self.valueOf()

		Template.instance().selectedUsers.set(users)

		$('#pvt-group-members').focus()

	'click .cancel-pvt-group': (e, instance) ->
		SideNav.closeFlex ->
			SideNav.setFlex null
			instance.clearForm()

	'click header': (e, instance) ->
		SideNav.closeFlex ->
			instance.clearForm()

	'mouseenter header': ->
		SideNav.overArrow()

	'mouseleave header': ->
		SideNav.leaveArrow()

	'keydown input[type="text"]': (e, instance) ->
		Template.instance().error.set([])

	'click .save-pvt-group': (e, instance) ->
		err = SideNav.validate()
		instance.groupName.set instance.find('#pvt-group-name').value
		if not err
			accessPermissions = instance.selectedLabelIds
			rid = instance.data.relabelRoom
			if rid
				Meteor.call 'updateRoom', rid, instance.find('#pvt-group-name').value, instance.selectedUsers.get(), accessPermissions, (err, result) ->
					if err
						return toastr.error err.reason
					SideNav.closeFlex()
					SideNav.setFlex null
					instance.clearForm()
					FlowRouter.go 'room', { _id: result.rid }
			else
				Meteor.call 'createPrivateGroup', instance.find('#pvt-group-name').value, instance.selectedUsers.get(), accessPermissions, (err, result) ->
					if err
						if err.error is 'name-invalid'
							instance.error.set({ invalid: true })
							return
						if err.error is 'duplicate-name'
							instance.error.set({ duplicate: true })
							return
						return toastr.error err.reason
					SideNav.closeFlex()
					SideNav.setFlex null
					instance.clearForm()
					FlowRouter.go 'room', { _id: result.rid }
		else
			Template.instance().error.set({fields: err})

Template.privateGroupsFlex.onCreated ->
	instance = this
	instance.selectedUsers = new ReactiveVar []
	instance.selectedUserNames = {}
	instance.otherMembers = []
	instance.error = new ReactiveVar []
	instance.securityLabelsInitialized = new ReactiveVar(false)

	# selected security label access permission ids
	instance.selectedLabelIds = []
	instance.disabledLabelIds = []
	instance.groupName = new ReactiveVar ''

	instance.clearForm = ->
		instance.error.set([])
		instance.groupName.set('')
		instance.selectedUsers.set([])
		instance.find('#pvt-group-name').value = ''
		instance.find('#pvt-group-members').value = ''


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
		# can't use this.data because it's not set with updated flex data
		data = SideNav.getFlex().data
		unless data
			return

		roomId = data?.relabelRoom
		# check if we are relabeling the room
		if roomId
			# get a subscription to the room (in case we don't have one already)
			Meteor.subscribe('room', roomId)
			# function will automatically re-run on changes to this session variable, thus
			# it will essentially "wait" for the data to get set
			if Session.get('roomData' + roomId)
				# get room data
				instance.room = Session.get('roomData' + roomId)
				# select existing permissions and disallow removing them
				options = roomLabelOptions(instance.room.accessPermissions, Meteor.user().profile.access)
				instance.selectedLabelIds = _.pluck( options.selected, '_id')
				instance.disabledLabelIds = _.pluck( options.disabled, '_id')
				instance.allowedLabels = options.allowed
				instance.groupName.set(instance.room.name)
				instance.room.usernames?.forEach (username) ->
					# TODO use name field instead of username.  Room only has username
					# so we need to make server call to get full name for a username
					instance.selectedUserNames[username] = username
				# other conversation members
				instance.selectedUsers.set instance.room.usernames
				instance.otherMembers = _.without(instance.room.usernames, Meteor.user().username)
				instance.securityLabelsInitialized.set true

		# if creating a new room (rather than relabel), populate default values (UNCLASS//RELTO USA)
		else
			options = roomLabelOptions([], Meteor.user().profile.access)
			instance.selectedLabelIds = _.pluck( options.selected, '_id')
			instance.disabledLabelIds = _.pluck( options.disabled, '_id')
			instance.allowedLabels = options.allowed
			instance.securityLabelsInitialized.set true

roomLabelOptions = (roomPermissionIds, userPermissionIds) ->
	if roomPermissionIds.length is 0
		# TODO read from system settings
		# default to USA and Unclass
		roomPermissionIds.push('300','U')

	classificationOrder = ['U','C','S','TS']

	# user's access permissions
	userPerms = AccessPermissions.find({_id:{$in: userPermissionIds}}).fetch()
	userCountry = _.find(userPerms, (perm) -> perm.type is 'Release Caveat')

	# all relto (non-user specific)	
	allReleaseCaveats = AccessPermissions.find({type:'Release Caveat'}).fetch()

	# room permissions
	roomPerms = AccessPermissions.find({_id:{$in: roomPermissionIds}}).fetch()
	roomClassification = _.find(roomPerms, (perm) -> perm.type is 'classification')
	roomClassificationIndex = _.indexOf(classificationOrder,roomClassification._id ) 
	allowedClassifications = _.rest(classificationOrder, roomClassificationIndex)

	# user can choose from same/higher them room classification,sci,sap assigned to them and ALL release caveats
	allowed = _.chain(userPerms)
		.filter( (perm) -> perm.type isnt 'classification' or perm._id in allowedClassifications )
		.concat(allReleaseCaveats)
		.uniq(false, (perm) -> perm._id)
		.value()

	# existing room selection should be selected and disabled so that the user can't 
	# downgrade the security level.  User country must be selected so that they can't 
	# exclude themselves, System country must be selected 
	required = _.chain(roomPerms)
		.concat(userCountry)
		.uniq(false, (perm) -> perm._id)
		.value()

	# preselect the room's selected permissions.  Make sure user country is selected
	selected = required

 	# allow the classification to be selected otherwise the user can't reselect it 
 	# in the drop down
	disabled = _.chain(required)
		.reject( (perm) -> perm._id is roomClassification._id )
		.value()

	return (
		allowed : allowed
		selected : selected
		disabled : disabled
		)
