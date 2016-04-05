Template.accountProfile.helpers
	allowDeleteOwnAccount: ->
		return RocketChat.settings.get('Accounts_AllowDeleteOwnAccount')

	realname: ->
		return Meteor.user().name

	username: ->
		return Meteor.user().username

	email: ->
		return Meteor.user().emails?[0]?.address

	emailVerified: ->
		return  Meteor.user().emails?[0]?.verified

	allowUsernameChange: ->
		return RocketChat.settings.get("Accounts_AllowUsernameChange") and RocketChat.settings.get("LDAP_Enable") isnt true

	allowEmailChange: ->
		return RocketChat.settings.get("Accounts_AllowEmailChange")

	usernameChangeDisabled: ->
		return t('Username_Change_Disabled')

	allowPasswordChange: ->
		return RocketChat.settings.get("Accounts_AllowPasswordChange")

	passwordChangeDisabled: ->
		return t('Password_Change_Disabled')

Template.accountProfile.onCreated ->
	settingsTemplate = this.parentTemplate(3)
	settingsTemplate.child ?= []
	settingsTemplate.child.push this

	@clearForm = ->
		@find('#password').value = ''

	@changePassword = (newPassword, callback) ->
		instance = @
		if not newPassword
			return callback()

		else
			if !RocketChat.settings.get("Accounts_AllowPasswordChange")
				toastr.remove();
				toastr.error t('Password_Change_Disabled')
				instance.clearForm()
				return

			# Accounts.changePassword oldPassword, newPassword, (error) ->
			# 	if error
			# 		toastr.error t('Incorrect_Password')
			# 	else
			# 		return callback()

	@save = (currentPassword) ->
		instance = @

		data = { currentPassword: currentPassword }

		if _.trim $('#password').val()
			data.newPassword = $('#password').val()

		if _.trim $('#realname').val()
			data.realname = _.trim $('#realname').val()

		if _.trim($('#username').val()) isnt Meteor.user().username
			if !RocketChat.settings.get("Accounts_AllowUsernameChange")
				toastr.remove();
				toastr.error t('Username_Change_Disabled')
				instance.clearForm()
				return
			else
				data.username = _.trim $('#username').val()

		if _.trim($('#email').val()) isnt Meteor.user().emails?[0]?.address
			if !RocketChat.settings.get("Accounts_AllowEmailChange")
				toastr.remove();
				toastr.error t('Email_Change_Disabled')
				instance.clearForm()
				return
			else
				data.email = _.trim $('#email').val()

		Meteor.call 'saveUserProfile', data, (error, results) ->
			if results
				toastr.remove();
				toastr.success t('Profile_saved_successfully')
				swal.close()
				instance.clearForm()

			if error
				toastr.remove();
				toastr.error error.reason

Template.accountProfile.onRendered ->
	Tracker.afterFlush ->
		# this should throw an error-template
		FlowRouter.go("home") if !RocketChat.settings.get("Accounts_AllowUserProfileChange")
		SideNav.setFlex "accountFlex"
		SideNav.openFlex()

Template.accountProfile.events
	'click .submit button': (e, instance) ->
		swal
			title: t("Please_re_enter_your_password"),
			text: t("For_your_security_you_must_re_enter_your_password_to_continue"),
			type: "input",
			inputType: "password",
			showCancelButton: true,
			closeOnConfirm: false

		, (typedPassword) =>
			if typedPassword
				toastr.remove();
				toastr.warning(t("Please_wait_while_your_profile_is_being_saved"));
				instance.save(SHA256(typedPassword))
			else
				swal.showInputError(t("You_need_to_type_in_your_password_in_order_to_do_this"));
				return false;
	'click .logoutOthers button': (event, templateInstance) ->
		Meteor.logoutOtherClients (error) ->
			if error
				toastr.remove();
				toastr.error error.reason
			else
				toastr.remove();
				toastr.success t('Logged_out_of_other_clients_successfully')
	'click .delete-account button': (e) ->
		e.preventDefault();
		swal
			title: t("Are_you_sure_you_want_to_delete_your_account"),
			text: t("If_you_are_sure_type_in_your_password"),
			type: "input",
			inputType: "password",
			showCancelButton: true,
			closeOnConfirm: false

		, (typedPassword) =>
			if typedPassword
				toastr.remove();
				toastr.warning(t("Please_wait_while_your_account_is_being_deleted"));
				Meteor.call 'deleteUserOwnAccount', SHA256(typedPassword), (error, results) ->
					if error
						toastr.remove();
						swal.showInputError(t("Your_password_is_wrong"));
					else
						swal.close();
			else
				swal.showInputError(t("You_need_to_type_in_your_password_in_order_to_do_this"));
				return false;

	'click #resend-verification-email': (e) ->
		e.preventDefault()

		e.currentTarget.innerHTML = e.currentTarget.innerHTML + ' ...'
		e.currentTarget.disabled = true

		Meteor.call 'sendConfirmationEmail', Meteor.user().emails?[0]?.address, (error, results) =>
			if results
				toastr.success t('Verification_email_sent')
			else if error?.reason?
				toastr.error error.reason
			else
				toastr.error t('Error_sending_confirmation_email')

			e.currentTarget.innerHTML = e.currentTarget.innerHTML.replace(' ...', '')
			e.currentTarget.disabled = false
