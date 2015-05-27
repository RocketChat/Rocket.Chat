Accounts.onEmailVerificationLink (token, done) ->
	Accounts.verifyEmail token, (error) ->
		if not error?
			alert(t('accounts.Email_verified'))

		done()

Accounts.onResetPasswordLink (token, done) ->
	newPassword = prompt(t('accounts.New_password'))
	Accounts.resetPassword token, newPassword, (error) ->
		if error?
			console.log error
			alert(t('accounts.Error_changing_password'))
		else
			alert('accounts.Password_changed')
		done()