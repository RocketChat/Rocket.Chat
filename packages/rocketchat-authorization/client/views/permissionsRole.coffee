window.rolee = Roles

Template.permissionsRole.helpers
	role: ->
		return Meteor.roles.findOne { name: FlowRouter.getParam('name') }

	userInRole: ->
		return Roles.getUsersInRole(FlowRouter.getParam('name'))

Template.permissionsRole.events

	'click .remove-user': (e, instance) ->
		e.preventDefault()

		swal
			title: t('Are_you_sure')
			type: 'warning'
			showCancelButton: true
			confirmButtonColor: '#DD6B55'
			confirmButtonText: t('Yes')
			cancelButtonText: t('Cancel')
			closeOnConfirm: false
			html: false
		, =>
			Meteor.call 'authorization:removeUserFromRole', FlowRouter.getParam('name'), @username, (error, result) ->
				if error
					return toastr.error t(error.reason or error.error)

				swal
					title: t('Removed')
					text: t('User_removed')
					type: 'success'
					timer: 1000
					showConfirmButton: false

	'submit #form-role': (e, instance) ->
		e.preventDefault()

		oldBtnValue = e.currentTarget.elements['save'].value

		e.currentTarget.elements['save'].value = t('Saving')

		Meteor.call 'authorization:saveRole', @_id, { description: e.currentTarget.elements['description'].value }, (error, result) ->
			e.currentTarget.elements['save'].value = oldBtnValue
			if error
				return toastr.error t(error.reason || error.error)

			toastr.success t('Saved')
			e.currentTarget.reset()

	'submit #form-users': (e, instance) ->
		e.preventDefault()

		if e.currentTarget.elements['username'].value.trim() is ''
			return toastr.error t('Please_fill_a_username')

		oldBtnValue = e.currentTarget.elements['add'].value

		e.currentTarget.elements['add'].value = t('Saving')

		Meteor.call 'authorization:addUserToRole', FlowRouter.getParam('name'), e.currentTarget.elements['username'].value, (error, result) ->
			e.currentTarget.elements['add'].value = oldBtnValue
			if error
				return toastr.error t(error.reason || error.error)

			toastr.success t('User_added')
			e.currentTarget.reset()

Template.permissionsRole.onCreated ->
	# @roles = []
	# @permissions = []
	# @permissionByRole = {}

	console.log Roles

	@subscribe 'roles', FlowRouter.getParam('name')
	@subscribe 'usersInRole', FlowRouter.getParam('name')

	# ChatPermissions
