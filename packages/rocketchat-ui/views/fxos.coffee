Template.fxOsInstallPrompt.onRendered ->
	showPrompt = () ->
		request = window.navigator.mozApps.install 'http://' + location.host + '/manifest.webapp'
		request.onsuccess = () ->
			# Save the App object that is returned
			appRecord = this.result
			BlazeLayout.render 'fxOsInstallDone'

		request.onerror = () ->
			# Display the error information from the DOMError object
			BlazeLayout.render 'fxOsInstallError', {installError: this.error.name}

	setTimeout(showPrompt, 2000);
	$('#initial-page-loading').remove()

Template.fxOsInstallDone.onRendered ->
	$('#initial-page-loading').remove()

Template.fxOsInstallError.onRendered ->
	$('#initial-page-loading').remove()
