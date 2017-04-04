Template.fxOsInstallPrompt.onRendered(function() {

	const showPrompt = function() {
		const request = window.navigator.mozApps.install(`http://${ location.host }/manifest.webapp`);
		request.onsuccess = function() {
			BlazeLayout.render('fxOsInstallDone');
		};
		request.onerror = function() {
			BlazeLayout.render('fxOsInstallError', {
				installError: this.error.name
			});
		};
	};
	setTimeout(showPrompt, 2000);
	return $('#initial-page-loading').remove();
});

Template.fxOsInstallDone.onRendered(() => $('#initial-page-loading').remove());
Template.fxOsInstallError.onRendered(() => $('#initial-page-loading').remove());
