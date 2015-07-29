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
		return Session.get('Relabel_room')?
	nameReadonly: ->
		if Session.get('Relabel_room') then 'readonly' else ''


Template.directMessagesFlex.events
	'autocompleteselect #who': (event, instance, doc) ->
		instance.selectedUser.set doc.username
		event.currentTarget.focus()
		parameters = {}
		parameters.usernames = [doc.username]
		Meteor.call 'getAllowedConversationPermissions', parameters, (err, result) ->
			if err
				return toastr.error err.reason
			console.log JSON.stringify result
			instance.accessOptions.set result

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
			rid = Session.get('Relabel_room')
			if rid
				Meteor.call 'updateDirectMessage', rid, instance.selectedUser.get(), accessPermissions, (err, result) ->
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

Template.directMessagesFlex.onRendered ->
	roomToRelabel = Session.get 'Relabel_room'
	if roomToRelabel?
		this.find('#who').value = this.selectedUser.get()
		Meteor.subscribe 'room', roomToRelabel

Template.directMessagesFlex.onCreated ->
	instance = this
	instance.selectedUser = new ReactiveVar
	instance.error = new ReactiveVar []
	instance.accessOptions = new ReactiveVar

	instance.clearForm = ->
		instance.error.set([])
		instance.selectedUser.set null
		instance.find('#who').value = ''
		instance.roomData = undefined
		Session.set("Relabel_room",undefined)

	instance.roomData = ChatRoom.findOne Session.get('Relabel_room'), { fields: { usernames: 1, t: 1, name: 1 } }
	if instance.roomData?.usernames
		username = _.without instance.roomData.usernames, Meteor.user().username
		instance.selectedUser.set username

	# other conversation members
	instance.otherMembers = _.without(instance.data.members, Meteor.userId())
	# labels that all members have in common
	instance.allowedLabels = []
	# reactive trigger set to true when labels returned asynchronously from server
	instance.securityLabelsInitialized = new ReactiveVar(false)
	# selected security label access permission ids
	instance.selectedLabelIds = []
	instance.disabledLabelIds = []
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
	Meteor.call 'getAllowedConversationPermissions', { userIds: instance.otherMembers }, (error, result) ->
		if error
			alert error
		else
# create shallow copies.  Adding id to both selected and disabled makes them "required"
# in the UI because it selects the permission and doesn't allow the user to remove it.
			instance.selectedLabelIds = (result.selectedIds or []).slice(0)
			instance.disabledLabelIds = (result.disabledIds or []).slice(0)
			# initially select the default classification
			# TODO: fix the following line
			#instance.selectedLabelIds.push Meteor.settings.public.permission.classification.default
			instance.allowedLabels = result.allowed or []
			# Meteor will automatically re-run helper methods that populate select boxes.
			instance.securityLabelsInitialized.set true
