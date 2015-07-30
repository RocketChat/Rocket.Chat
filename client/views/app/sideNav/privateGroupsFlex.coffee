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
		SideNav.closeFlex()

	'click header': (e, instance) ->
		SideNav.closeFlex()

	'mouseenter header': ->
		SideNav.overArrow()

	'mouseleave header': ->
		SideNav.leaveArrow()

	'keydown input[type="text"]': (e, instance) ->
		Template.instance().error.set([])

	'click .save-pvt-group': (e, instance) ->
		err = SideNav.validate()
		if not err
			accessPermissions = instance.selectedLabelIds
			rid = instance.data.relabelRoom
			if rid
				Meteor.call 'updateRoom', rid, instance.find('#pvt-group-name').value, instance.selectedUsers.get(), accessPermissions, (err, result) ->
					if err
						return toastr.error err.reason
					SideNav.closeFlex()
					instance.clearForm()
					Router.go 'room', { _id: result.rid }
			else
				Meteor.call 'createPrivateGroup', instance.find('#pvt-group-name').value, instance.selectedUsers.get(), accessPermissions, (err, result) ->
					if err
						return toastr.error err.reason
					SideNav.closeFlex()
					instance.clearForm()
					Router.go 'room', { _id: result.rid }
		else
			Template.instance().error.set(err)

Template.privateGroupsFlex.onCreated ->
	instance = this
	instance.selectedUsers = new ReactiveVar []
	instance.selectedUserNames = {}
	instance.otherMembers = []
	instance.error = new ReactiveVar []
	instance.groupName = new ReactiveVar ''
	# if relabelRoom (the roomId) is specified in context, then we're editing a room
	instance.room = Session.get('roomData' + instance.data.relabelRoom );

	# labels assignable by the current user
	userPerms = AccessPermissions.find({_id:{$in: Meteor.user().profile.access}}).fetch()
	reltoPerms = AccessPermissions.find({type:'Release Caveat'}).fetch()
	instance.allowedLabels = _.chain(userPerms).push(reltoPerms).flatten().uniq(false, (item)->return item._id).value()

	# TODO remove init call since we're not calling the server anymore
	instance.securityLabelsInitialized = new ReactiveVar(false)

	# selected security label access permission ids
	instance.selectedLabelIds = []
	instance.disabledLabelIds = []

	instance.clearForm = ->
		instance.error.set([])
		instance.groupName.set('')
		instance.selectedUsers.set([])
		instance.find('#pvt-group-name').value = ''
		instance.find('#pvt-group-members').value = ''

	# room is set if we're editing an existing room
	if instance.room
		# select existing permissions and disallow removing them
		instance.selectedLabelIds = instance.room.accessPermissions
		instance.disabledLabelIds = instance.room.accessPermissions
		instance.groupName.set(instance.room.name)
		instance.room.usernames?.forEach (username) ->
			# TODO use name field instead of username.  Room only has username
			# so we need to make server call to get full name for a username
			instance.selectedUserNames[username] = username
			instance.selectedUsers.set instance.selectedUsers.get().concat username	
			# other conversation members
			instance.otherMembers = _.without(instance.room.usernames, Meteor.user().username)
	else
		userCountryCode = _.find(userPerms, (perm) -> return perm.type is 'Release Caveat' )
		# TODO update to get default classification setting and system country code
		instance.selectedLabelIds = _.uniq(['U', '300', userCountryCode?._id])
		instance.disabledLabelIds = _.uniq(['300', userCountryCode?._id])

	instance.securityLabelsInitialized.set true

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

