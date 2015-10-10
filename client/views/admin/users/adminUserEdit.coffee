Template.adminUserEdit.helpers
	email: ->
		return @emails?[0]?.address

Template.adminUserEdit.events
	'click .cancel': (e, t) ->
		e.stopPropagation()
		e.preventDefault()
		t.cancel()

	'click .save': (e, t) ->
		e.stopPropagation()
		e.preventDefault()
		t.save()

Template.adminUserEdit.onCreated ->
	instance = @

	@cancel = ->
		RocketChat.TabBar.setTemplate 'adminUserInfo'

	@save = ->
		userData = { _id: Template.currentData()._id }
		userData.name = $("#name", ".edit-form").val()
		userData.username = $("#username", ".edit-form").val()

		unless userData._id and userData.name
			toastr.error TAPi18n.__('The_field_is_required'), TAPi18n.__('Name')
		else
			Meteor.call 'updateUser', userData, (error, result) ->
				if result
					toastr.success t('User_updated_successfully')
					instance.cancel()
				if error
					toastr.error error.reason