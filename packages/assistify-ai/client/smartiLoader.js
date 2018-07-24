/* globals RocketChat */

/**
 * Load Smarti script asynchronously to the window.
 * This ensures the invalidation as settings are changed and allow the script to live beyond template lifetime.
 */
RocketChat.settings.onload('Assistify_AI_Smarti_Base_URL', function() {
	Meteor.call('getSmartiUiScript', function(error, script) {
		if (error) {
			console.error('could not load Smarti:', error.message);
		} else {
			// generate a script tag for smarti JS
			const doc = document;
			const smartiScriptTag = doc.createElement('script');
			smartiScriptTag.type = 'text/javascript';
			smartiScriptTag.async = true;
			smartiScriptTag.defer = true;
			smartiScriptTag.innerHTML = script;
			// insert the smarti script tag as first script tag
			const firstScriptTag = doc.getElementsByTagName('script')[0];
			firstScriptTag.parentNode.insertBefore(smartiScriptTag, firstScriptTag);
			console.debug('loaded Smarti successfully');
		}
	});
});
