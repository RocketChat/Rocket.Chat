Template.adminUserEdit.helpers
	canEditOrAdd: ->
		return (Session.get('adminSelectedUser') and RocketChat.authz.hasAtLeastOnePermission('edit-other-user-info')) or (not Session.get('adminSelectedUser') and RocketChat.authz.hasAtLeastOnePermission('create-user'))

	user: ->
		return Meteor.users.findOne(Session.get('adminSelectedUser'))

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
	@cancel = =>
		RocketChat.TabBar.setTemplate 'adminUserInfo'

	@getUserData = =>
		userData = { _id: Session.get('adminSelectedUser') }
		userData.name = s.trim(this.$("#name").val())
		userData.username = s.trim(this.$("#username").val())
		userData.email = s.trim(this.$("#email").val())
		userData.password = s.trim(this.$("#password").val())
		userData.requirePasswordChange = this.$("#changePassword:checked").length > 0
		return userData

	@validate = =>
		userData = this.getUserData()

		errors = []
		unless userData.name
			errors.push 'Name'
		unless userData.username
			errors.push 'Username'
		unless userData.email
			errors.push 'E-mail'

		for error in errors
			toastr.error(TAPi18n.__('The_field_is_required', TAPi18n.__(error)))

		return errors.length is 0

	@save = =>
		if this.validate()
			userData = this.getUserData()
			Meteor.call 'insertOrUpdateUser', userData, (error, result) =>
				if result
					if userData._id
						toastr.success t('User_updated_successfully')
					else
						toastr.success t('User_added_successfully')
						Session.set('adminSelectedUser', result);
						Session.set('showUserInfo', result);
						Meteor.subscribe 'fullUserData', userData.username, 1

					this.cancel()
				if error
					toastr.error error.reason
