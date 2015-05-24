Mesosphere.Utils.failureCallback = (erroredFields, formHandle) ->
	$('.has-error', formHandle).removeClass('has-error')
	for key, field of erroredFields
		formHandle.find("[name='#{key}']").parent().addClass('has-error')

Mesosphere.Utils.successCallback = (formData, formHandle) ->
	$('.meso-error').text ''
	$('.meso-error').removeClass 'meso-error'
	$('.has-error', formHandle).removeClass 'has-error'