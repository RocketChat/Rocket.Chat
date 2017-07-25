/* globals SystemLogger */

let script;

Meteor.methods({
	getSmartiUiScript() {
		if (script) { //buffering
			return script;
		}
		const DBS_AI_SMARTI_URL =
			RocketChat.settings.get('DBS_AI_Redlink_URL').endsWith('/') ?
				RocketChat.settings.get('DBS_AI_Redlink_URL') :
				`${ RocketChat.settings.get('DBS_AI_Redlink_URL') }/`;
		SystemLogger.debug('Trying to retrieve Smarti UI from', DBS_AI_SMARTI_URL);

		const response = HTTP.get(`${ DBS_AI_SMARTI_URL }plugin/v1/rocket.chat.js`);
		if (response.statusCode === 200) {
			script = response.content;

			if (!script) {
				SystemLogger.error('Could not extract script from Smarti response');
				throw new Meteor.Error('no-smarti-ui-script');
			} else {
				return script;
			}
		} else {
			SystemLogger.error('Could not reach Smarti service at', DBS_AI_SMARTI_URL);
			throw new Meteor.Error('no-smarti-ui-script');
		}
	}
});
