Template.userEdit.helpers
	canEditOrAdd: ->
		return (Template.instance().user and RocketChat.authz.hasAtLeastOnePermission('edit-other-user-info')) or (not Template.instance().user and RocketChat.authz.hasAtLeastOnePermission('create-user'))

	user: ->
		return Template.instance().user

	requirePasswordChange: ->
		return !Template.instance().user || Template.instance().user.requirePasswordChange

Template.userEdit.events
	'click .cancel': (e, t) ->
		e.stopPropagation()
		e.preventDefault()
		t.cancel(t.find('form'))

	'click #randomPassword': (e, t) ->
		e.stopPropagation()
		e.preventDefault()
		$('#password').val(Random.id())

	'submit form': (e, t) ->
		e.stopPropagation()
		e.preventDefault()

		t.save(e.currentTarget)

Template.userEdit.onCreated ->
	@user = this.data?.user

	@cancel = (form, username) =>
		form.reset()
		this.$('input[type=checkbox]').prop('checked', true);
		if @user
			@data.back(username)
		else
			RocketChat.TabBar.closeFlex()

	@getUserData = =>
		userData = { _id: @user?._id }
		userData.name = s.trim(this.$("#name").val())
		userData.username = s.trim(this.$("#username").val())
		userData.email = s.trim(this.$("#email").val())
		userData.verified = this.$("#verified:checked").length > 0
		userData.password = s.trim(this.$("#password").val())
		userData.requirePasswordChange = this.$("#changePassword:checked").length > 0
		userData.joinDefaultChannels = this.$("#joinDefaultChannels:checked").length > 0
		userData.sendWelcomeEmail = this.$("#sendWelcomeEmail:checked").length > 0
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

	@save = (form) =>
		if this.validate()
			userData = this.getUserData()
			Meteor.call 'insertOrUpdateUser', userData, (error, result) =>
				if result
					if userData._id
						toastr.success t('User_updated_successfully')
					else
						toastr.success t('User_added_successfully')

					@cancel(form, userData.username)

				if error
					handleError(error);
