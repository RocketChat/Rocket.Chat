import async from 'async';

Template.dbsAI_smarti.onCreated(function() {
	this.helpRequest = new ReactiveVar(null);
	const instance = this;

	Meteor.subscribe('assistify:helpRequests', instance.data.rid); //not reactively needed, as roomId doesn't change

	this.autorun(() => {
		if (instance.data.rid) {
			const helpRequest = RocketChat.models.HelpRequests.findOneByRoomId(instance.data.rid);
			instance.helpRequest.set(helpRequest);
		}
	});

});

Template.dbsAI_smarti.onDestroyed(function() {
	clearTimeout(this.loading);
});

/**
 * Create Smarti (as soon as the script is loaded)
 */
Template.dbsAI_smarti.onRendered(function() {

	const self = this;

	function createSmarti() {
		if (window.SmartiWidget === undefined) {
			console.log('Smarti is undefined');
			self.loading = setTimeout(createSmarti, 200);
		} else {

			const DBS_AI_Redlink_URL =
				RocketChat.settings.get('DBS_AI_Redlink_URL').endsWith('/') ?
					RocketChat.settings.get('DBS_AI_Redlink_URL') :
					`${ RocketChat.settings.get('DBS_AI_Redlink_URL') }/`;

			const SITE_URL_W_SLASH =
				RocketChat.settings.get('Site_Url').endsWith('/') ?
					RocketChat.settings.get('Site_Url') :
					`${ RocketChat.settings.get('Site_Url') }/`;

			// stripping only the protocol ("http") from the site-url either creates a secure or an insecure websocket connection
			const WEBSOCKET_URL = `ws${ SITE_URL_W_SLASH.substring(4) }websocket/`;

			let customSuffix = RocketChat.settings.get('Assistify_AI_DBSearch_Suffix') || '';
			customSuffix = customSuffix.replace(/\r\n|\r|\n/g, '');

			const WIDGET_POSTING_TYPE = RocketChat.settings.get('Assistify_AI_Widget_Posting_Type') || 'postRichText';
			console.log(WIDGET_POSTING_TYPE, RocketChat.settings.get('Assistify_AI_Widget_Posting_Type'));

			const smartiOptions = {
				socketEndpoint: WEBSOCKET_URL,
				smartiEndpoint: DBS_AI_Redlink_URL,
				channel: self.data.rid,
				postings: {
					type: WIDGET_POSTING_TYPE,
					cssInputSelector: '.message-form-text.input-message'
				},
				widget: {
					'query.dbsearch': {
						numOfRows: 2,
						suffix: customSuffix
					},
					'query.dbsearch.keyword': {
						numOfRows: 2,
						suffix: customSuffix,
						disabled: true
					}
				},
				lang: 'de'
			};
			self.smarti = new window.SmartiWidget(self.find('.external-message'), smartiOptions);
		}
	}

	createSmarti();

});

Template.dbsAI_smarti.helpers({
	isLivechat() {
		const instance = Template.instance();
		return ChatSubscription.findOne({rid: instance.data.rid}).t === 'l';
	},
	/**
	 This helper is needed in order to create an object which matches the actions bar importing parameters
	 */
	liveChatActions() {
		const instance = Template.instance();
		return {roomId: instance.data.rid};
	},
	helpRequestByRoom() {
		const instance = Template.instance();
		return instance.helpRequest.get();
	}
});

/**
 * Load Smarti script
 */

const asynVariabelLoad = (variable, cb) => {
	RocketChat.settings.onload(variable, (n, v) => {
		cb(null, v);
	});
};

async.map(['DBS_AI_Enabled', 'DBS_AI_Redlink_URL', 'DBS_AI_Source'], asynVariabelLoad, function(err, results) {

	if (err) { return console.error('could not load Smarti:', err.message); }

	if (results[0] && results[1] && results[1] !== '' && results[2] === '2') {
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
	}
});
