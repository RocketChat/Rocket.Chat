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
		instance.updateWarnIds()

	'click .cancel-direct-message': (e, instance) ->
		SideNav.closeFlex ->
			SideNav.setFlex null
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
					SideNav.setFlex null
					instance.clearForm()
					FlowRouter.go 'room', { _id: result.rid }
			else
				Meteor.call 'createDirectMessage', instance.selectedUser.get(), accessPermissions, (err, result) ->
					if err
						return toastr.error err.reason
					SideNav.closeFlex()
					SideNav.setFlex null
					instance.clearForm()
					FlowRouter.go 'room', { _id: result.rid }
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

	# labels that the current user has access to
	instance.allowedLabels = []
	# reactive trigger set to true when labels returned asynchronously from server
	instance.securityLabelsInitialized = new ReactiveVar(false)
	# selected security label access permission ids
	instance.selectedLabelIds = []
	Session.set 'selectedLabelIds', []
	instance.disabledLabelIds = []

	# security label and user ids flagged for warning
	Session.set 'warnLabelIds', []

	# adds/remove access permission ids from list of selected labels
	instance.onSelectionChanged = (params) ->
		if params.selected
			instance.selectedLabelIds.push params.selected
		else if params.deselected
			# remove deselected if it exist
			instance.selectedLabelIds = _.without(instance.selectedLabelIds, params.deselected)
		Session.set 'selectedLabelIds', instance.selectedLabelIds
		instance.updateWarnIds()

	instance.isOptionSelected = (id) ->
		_.contains instance.selectedLabelIds, id

	# determine if label is disabled
	instance.isOptionDisabled = (id) ->
		_.contains instance.disabledLabelIds, id


	# Update the list of access permission ids that the current user has access to but any
	# current room members cannot and, similarly, the list of current room members that do
	# not have access to one or more currently-selected labels. These lists will be used by
	# other templates to determine how to style labeling/membership options. This function
	# should be called upon every change to security labels and room membership.
	instance.updateWarnIds = ->

		# call the 'canAccessResource' method using current members and all of the current
		# user's access permissions as parameters
		users = [Meteor.userId()]
		otherUser = instance.selectedUser.get()
		if otherUser?
			users.push otherUser
		
		myPermIds = Meteor.user().profile.access
		Meteor.call 'canAccessResource', users, myPermIds, (error, result) ->
			if error
				toastr.error 'Unexpected error during permission check!'
			else
				warnLabelIds = []
				for denied in result.deniedUsers

					# separate out the currently-selected permissions by type - relto/non-relto
					selectedReltoIds = _.pluck(AccessPermissions.find({_id: {$in: instance.selectedLabelIds}, type: {$nin: ['classification', 'SAP', 'SCI']}}).fetch(), '_id')
					selectedOtherIds = _.pluck(AccessPermissions.find({_id: {$in: instance.selectedLabelIds}, type: {$nin: ['Release Caveat']}}).fetch(), '_id')
					

					# determine which of the 'failed' ids are currently selected
					# (or missing, in the case of relto)
					selectedFailedOtherIds = []
					nonSelectedFailedReltoIds = []
					for failedId in denied.failedPermIds
						perm = AccessPermissions.findOne({_id: failedId})
						if perm.type is 'Release Caveat'
							if failedId not in selectedReltoIds
								nonSelectedFailedReltoIds.push perm.label
						else
							if failedId in selectedOtherIds
								selectedFailedOtherIds.push perm.label


					# if any are selected (any added to these lists), add the user to the 'warnUserIds' list
					if (selectedFailedOtherIds.length > 0) or (nonSelectedFailedReltoIds.length > 0)
						$('#who').css('color', 'red')

						# build and display warning message
						if selectedFailedOtherIds.length > 0
							toastr.warning 'User [' + denied.user + '] does not have access to some of the selected labels: [' + selectedFailedOtherIds.join('], [') + '].'
						if nonSelectedFailedReltoIds.length > 0
							toastr.warning 'User [' + denied.user + '] requires release caveats: [' + nonSelectedFailedReltoIds.join('], [') + '].'
					else
						$('#who').removeAttr('style')

					# add all failed perms to a list (even if not selected - this is so the
					# security labels template can determine which non-selected labels WOULD
					# cause a problem if selected)
					for perm in denied.failedPermIds
						if perm not in warnLabelIds
							warnLabelIds.push perm

				if result.deniedUsers.length is 0
					$('#who').removeAttr('style')

				# set the session for communicating with other templates
				Session.set 'warnLabelIds', warnLabelIds




	# Tracker.autorun function that gets executed on template creation, and then re-executed
	# on changes to the reactive inputs (in this case, Session data and subscription to the
	# 'room' publication). If the 'relabelRoom' variable is set in the data context (meaning
	# we are relabeling rather than creating a room), get a subscription and then "wait" for
	# the room data to be populated in Session variable (see roomObserve.coffee). Once that
	# data is set, stop further execution of this function and then populate the label info
	# input fields for the room.
	#
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
				Session.set 'selectedLabelIds', instance.selectedLabelIds
				instance.disabledLabelIds = _.pluck( options.disabled, '_id')
				instance.allowedLabels = options.allowed
				username = _.without(instance.room.usernames, Meteor.user().username)[0]
				instance.selectedUser.set username
				instance.securityLabelsInitialized.set true

		# if creating a new room (rather than relabel), populate default values (UNCLASS//RELTO USA)
		else
			options = roomLabelOptions([], Meteor.user().profile.access)
			instance.selectedLabelIds = _.pluck( options.selected, '_id')
			Session.set 'selectedLabelIds', instance.selectedLabelIds
			instance.disabledLabelIds = _.pluck( options.disabled, '_id')
			instance.allowedLabels = options.allowed
			if data?.user
				instance.selectedUser.set data.user
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
