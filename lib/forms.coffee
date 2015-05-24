Mesosphere.Utils.failureCallback = (erroredFields, formHandle) ->
	$('.has-error', formHandle).removeClass('has-error')
	for key, field of erroredFields
		formHandle.find("[name='#{key}']").parent().addClass('has-error')

Mesosphere
	id: 'login-card'
	template: 'loginForm'
	fields:
		email:
			required: true
		pass:
			required: true

Mesosphere
	id: 'login-card-register'
	template: 'loginForm'
	fields:
		name:
			required: true
		email:
			required: true
		pass:
			required: true
