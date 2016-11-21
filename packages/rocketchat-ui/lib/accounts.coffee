import toastr from 'toastr'
Accounts.onEmailVerificationLink (token, done) ->
	Accounts.verifyEmail token, (error) ->
		if not error?
			toastr.success t('Email_verified')
		done()
