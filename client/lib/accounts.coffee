Accounts.onEmailVerificationLink (token, done) ->
	Accounts.verifyEmail token, (error) ->
		if not error?
			alert(t('Email_verified'))

		done()

Accounts.onResetPasswordLink (token, done) ->
	newPassword = prompt(t('New_password'))
	Accounts.resetPassword token, newPassword, (error) ->
		if error?
			console.log error
			alert(t('Error_changing_password'))
		else
			alert('Password_changed')
		done()