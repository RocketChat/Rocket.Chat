Accounts.onEmailVerificationLink (token, done) ->
	Accounts.verifyEmail token, (error) ->
		if not error?
			alert(t('Email_verified'))

		done()
