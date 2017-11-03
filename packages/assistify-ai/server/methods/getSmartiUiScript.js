/* globals SystemLogger */

let script;
let timeoutHandle;


function loadSmarti() {
	if (!RocketChat.settings.get('DBS_AI_Redlink_URL').trim()) {
		throw new Meteor.Error('no-smarti-url-configured');
	}

	const DBS_AI_SMARTI_URL =
		RocketChat.settings.get('DBS_AI_Redlink_URL').endsWith('/') ?
			RocketChat.settings.get('DBS_AI_Redlink_URL') :
			`${ RocketChat.settings.get('DBS_AI_Redlink_URL') }/`;
	const DBS_AI_SMARTI_WIDGET_URL = `${ DBS_AI_SMARTI_URL }plugin/v1/rocket.chat.js`;

	let response = null;
	try {
		SystemLogger.debug('Trying to retrieve Smarti-Widget script from', DBS_AI_SMARTI_WIDGET_URL);
		response = HTTP.get(DBS_AI_SMARTI_WIDGET_URL);
	} catch (error) {
		SystemLogger.error('Could not load the Smarti-Widget script at', DBS_AI_SMARTI_URL);
		SystemLogger.debug(error);
		throw new Meteor.Error('error-unreachable-url');
	}

	if (response && response.statusCode === 200) {
		script = response.content;

		if (!script) {
			SystemLogger.error('Could not extract script from Smarti response');
			throw new Meteor.Error('no-smarti-ui-script', 'no-smarti-ui-script');
		} else {
			// add pseudo comment in order to make the script appear in the frontend as a file. This makes it de-buggable
			script = `${ script } //# sourceURL=SmartiWidget.js`;
		}
	} else {
		SystemLogger.error('Could not load Smarti script from', DBS_AI_SMARTI_URL);
		throw new Meteor.Error('no-smarti-ui-script', 'no-smarti-ui-script');
	}

}

function delayedReload() {
	if (timeoutHandle) {
		Meteor.clearTimeout(timeoutHandle);
	}
	timeoutHandle = Meteor.setTimeout(loadSmarti(), 86400000);
}

/**
 * This method can be used to explicitly trigger a reconfiguration of the smart-widget
 */
Meteor.methods({
	reloadSmarti() {
		script = undefined;
		loadSmarti();
		delayedReload();

		return {
			message: 'settings-reloaded-successfully'
		};
	}
});

Meteor.methods({
	getSmartiUiScript() {
		if (!script) { //buffering
			loadSmarti();
			delayedReload();
		}
		return script;
	}
});
