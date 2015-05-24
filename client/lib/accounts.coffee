Accounts.onEmailVerificationLink (token, done) ->
	Accounts.verifyEmail token, (error) ->
		if not error?
			alert('Email verified')

		done()

Accounts.onResetPasswordLink (token, done) ->
	newPassword = prompt('New password')
	Accounts.resetPassword token, newPassword, (error) ->
		if error?
			console.log error
			alert('Error while changing password')
		else
			alert('Password changed')
		done()