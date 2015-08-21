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
		$('.user-info-content').hide()
		$('#adminUserInfo').show()

	@save = ->
		userData = { _id: Template.currentData()._id }
		userData.name = $("#name", ".edit-form").val()

		unless userData._id and userData.name
			toastr.error TAPi18next.t 'project:The_field_is_required', TAPi18next.t 'project:Name'
		else
			Meteor.call 'updateUser', userData, (error, result) ->
				if result 
					toastr.success t('User_updated_successfully')
					instance.cancel()
				if error
					toastr.error error.reason