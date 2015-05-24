Accounts.onEmailVerificationLink (token, done) ->
	Accounts.verifyEmail token, (error) ->
		if not error?
			alert('Email verified')

		done()