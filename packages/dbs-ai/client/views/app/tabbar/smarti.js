Template.dbsAI_smarti.onCreated(function() {
	this.helpRequest = new ReactiveVar(null);

	const instance = this;

	this.autorun(() => {
		if (instance.data.rid) {

			if (!instance.helpRequest.get()) { //todo remove after PoC: Non-reactive method call
				Meteor.call('assistify:helpRequestByRoomId', instance.data.rid, (err, result) => {
					if (!err) {
						instance.helpRequest.set(result);
					} else {
						console.log(err);
					}
				});
			}
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

	var self = this;

	function createSmarti() {
		if(window.SmartiWidget == undefined) {
			console.log('Smarti is undefined');
			self.loading = setTimeout(createSmarti,200);
		} else {

			var DBS_AI_Redlink_URL =
				RocketChat.settings.get('DBS_AI_Redlink_URL').endsWith('/') ?
					RocketChat.settings.get('DBS_AI_Redlink_URL') :
				RocketChat.settings.get('DBS_AI_Redlink_URL') + '/';

			var WEBSOCKET_URL =
				"ws" + RocketChat.settings.get('Site_Url').substring(4) + "websocket/";

			var WIDGET_POSTING_TYPE = RocketChat.settings.get('Assistify_AI_Widget_Posting_Type') || 'postRichText';

			console.log(WIDGET_POSTING_TYPE, RocketChat.settings.get('Assistify_AI_Widget_Posting_Type'));

			self.smarti = new window.SmartiWidget(self.find('.external-message'), {
				socketEndpoint: WEBSOCKET_URL,
				smartiEndpoint: DBS_AI_Redlink_URL,
				channel: self.data.rid,
				postings: {
					type: WIDGET_POSTING_TYPE,
					cssInputSelector: '.message-form-text.input-message'
				}
			});
		}
	}
	createSmarti();

});

Template.dbsAI_smarti.helpers({
	isLivechat() {
		const instance = Template.instance();
		return ChatSubscription.findOne({rid: instance.data.rid}).t === 'l';
	},
	helpRequestByRoom() {
		const instance = Template.instance();
		return instance.helpRequest.get();
	}
});

/**
 * Load Smarti script
 */
RocketChat.settings.onload('DBS_AI_Redlink_URL',function(key,value){

	var DBS_AI_Redlink_URL = value.endsWith('/') ? value : value + '/';

	$.getScript(DBS_AI_Redlink_URL + 'plugin/v1/rocket.chat.js')
		.done(function(){
			console.debug('loaded Smarti successfully');
		})
		.fail(function( jqxhr, settings, exception ) {
			console.error('could not load Smarti:', exception);
		});
});
