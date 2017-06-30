Template.dbsAI_smarti.onDestroyed(function() {
	clearTimeout(this.loading);
});

/**
 * Create Smarti (as soon as the script is loaded)
 */
Template.dbsAI_smarti.onRendered(function() {

	var self = this;

	function createSmarti() {
		if(window.SmartiWidget == undefined) {
			console.log('Smarti is undefined');
			self.loading = setTimeout(createSmarti,2000);
		} else {
			self.smarti = new window.SmartiWidget(self.find('.external-message'), {
				socketEndpoint: RocketChat.settings.get('DBS_AI_Redlink_Domain'),
				smartiEndpoint: RocketChat.settings.get('DBS_AI_Redlink_URL'),
				channel: self.data.rid,
				inputCssSelector:'.autogrow-shadow'
			});
		}
	}
	createSmarti();

});

/**
 * Load Smarti script
 */
(function(){
	console.log(RocketChat.settings.get('DBS_AI_Redlink_URL')); //TODO set url
	$.getScript('http://localhost:3333/dist/bundle.js')
		.done(function(){
			console.debug('loaded Smarti successfully');
		})
		.fail(function( jqxhr, settings, exception ) {
			console.error('could not load Smarti:', exception);
		});
})();
